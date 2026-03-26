import { NextResponse } from 'next/server';
import { getSessionCompanyUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';
import { recalculateAccountBalance } from '@/lib/accounting';

// GET /api/settings/assets - Get all fixed assets
export async function GET(request: Request) {
  try {
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const assets = await prisma.fixedAsset.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    const processedAssets = assets.map((asset: any) => ({
      ...asset,
      value: asset.value instanceof Decimal ? asset.value.toNumber() : Number(asset.value),
      currentBookValue: asset.currentBookValue instanceof Decimal ? asset.currentBookValue.toNumber() : Number(asset.currentBookValue),
    }));

    // Calculate total from transactions (real expenses)
    const totalExpenseResult = await prisma.transaction.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        companyId,
        category: 'FIXED_ASSET_PURCHASE',
        type: { in: ['EXPENSE', 'DEBT_TAKEN'] } // Ensure it's an expense
      },
    });

    const totalAssetExpense = totalExpenseResult._sum.amount ? Number(totalExpenseResult._sum.amount) : 0;

    return NextResponse.json({
      assets: processedAssets,
      totalAssetExpense,
      message: 'Assets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching assets:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assets' },
      { status: 500 }
    );
  }
}

// POST /api/settings/assets - Create new fixed asset
export async function POST(request: Request) {
  try {
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assets: assetList, accountId, vendorId, note } = body;

    if (!assetList || !Array.isArray(assetList) || assetList.length === 0) {
      return NextResponse.json(
        { message: 'Fadlan ku dar ugu yaraan hal hanti.' },
        { status: 400 }
      );
    }

    // Process all assets in a single transaction sequence
    const results = await prisma.$transaction(async (tx) => {
      const createdAssets = [];
      const createdTransactions = [];

      for (const item of assetList) {
        const { name, type, value, purchaseDate, depreciationRate, currentBookValue, assignedTo } = item;
        
        if (!name || !type || value === undefined || !purchaseDate) {
          throw new Error(`Xogta hantida "${name || 'aan la aqoon'}" waa mid dhiman.`);
        }

        const purchaseDateObj = new Date(purchaseDate);
        const yearsInUse = Math.max(0, new Date().getFullYear() - purchaseDateObj.getFullYear());
        const initialValue = Number(value);
        const rate = depreciationRate !== undefined ? parseFloat(depreciationRate) : 0;
        const calculatedBookValue = currentBookValue !== undefined 
          ? Number(currentBookValue) 
          : Math.max(0, initialValue - (initialValue * rate * yearsInUse));

        // 1) Create the fixed asset record
        const asset = await tx.fixedAsset.create({
          data: {
            name,
            type,
            value: new Decimal(value),
            purchaseDate: purchaseDateObj,
            assignedTo: assignedTo || 'Office',
            status: 'Active',
            companyId,
            depreciationRate: rate,
            currentBookValue: new Decimal(calculatedBookValue),
          },
        });

        createdAssets.push(asset);

        // 2) If an account is provided, create a transaction for THIS asset
        if (accountId && initialValue > 0) {
          const transaction = await tx.transaction.create({
            data: {
              description: `Hanti Iib: ${name}`,
              amount: new Decimal(value),
              type: 'EXPENSE',
              transactionDate: purchaseDateObj,
              note: note || null,
              accountId,
              vendorId: vendorId || null,
              companyId,
              category: 'FIXED_ASSET_PURCHASE',
              fixedAssetId: asset.id,
            },
          });
          createdTransactions.push(transaction);
        }
      }

      return { createdAssets, createdTransactions };
    });

    // 3) Recalculate account balance once at the end
    if (accountId) {
      await recalculateAccountBalance(accountId);
    }

    return NextResponse.json({
      assets: results.createdAssets,
      transactions: results.createdTransactions,
      message: `${results.createdAssets.length} hanti go'an ayaa si guul leh loo diiwaan geliyay.`
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { message: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

