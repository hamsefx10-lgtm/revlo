import { NextResponse } from 'next/server';
import { getSessionCompanyUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { Decimal } from '@prisma/client/runtime/library';

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
      assets,
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

    const { name, type, value, purchaseDate, assignedTo, depreciationRate, currentBookValue, vendorId, accountId, note } = await request.json();

    if (!name || !type || !value || !purchaseDate) {
      return NextResponse.json(
        { message: 'Name, type, value, and purchase date are required' },
        { status: 400 }
      );
    }

    // 1) Create the fixed asset record
    const asset = await prisma.fixedAsset.create({
      data: {
        name,
        type,
        value: parseFloat(value),
        purchaseDate: new Date(purchaseDate),
        assignedTo: assignedTo || 'Office',
        status: 'Active',
        companyId,
        depreciationRate: depreciationRate !== undefined ? parseFloat(depreciationRate) : 0,
        currentBookValue: currentBookValue !== undefined ? parseFloat(currentBookValue) : parseFloat(value),
      },
    });

    let createdTransaction: any = null;

    // 2) If an account is provided, create a transaction and deduct from the account balance
    if (accountId && Number(value) > 0) {
      createdTransaction = await prisma.transaction.create({
        data: {
          description: `Fixed Asset Purchase - ${name}`,
          amount: new Decimal(value),
          type: 'EXPENSE',
          transactionDate: new Date(purchaseDate),
          note: note || null,
          accountId,
          vendorId: vendorId || null,
          companyId,
          category: 'FIXED_ASSET_PURCHASE',
        },
      });

      // Deduct from account balance
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: Number(value) } },
      });
    }

    return NextResponse.json({
      asset,
      transaction: createdTransaction,
      message: 'Asset created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating asset:', error);
    return NextResponse.json(
      { message: 'Failed to create asset' },
      { status: 500 }
    );
  }
}

