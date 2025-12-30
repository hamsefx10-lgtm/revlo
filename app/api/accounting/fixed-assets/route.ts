// app/api/accounting/fixed-assets/route.ts - Fixed Assets API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type
import { getSessionCompanyId } from './auth';

// GET /api/accounting/fixed-assets - Soo deji dhammaan hantida go'an
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const fixedAssets = await prisma.fixedAsset.findMany({
      where: { companyId },
      orderBy: {
        name: 'asc',
      },
    });
    const processedAssets = fixedAssets.map((asset: any) => ({
      ...asset,
      value: asset.value.toNumber(),
      currentBookValue: asset.currentBookValue.toNumber(),
    }));
    return NextResponse.json({ assets: processedAssets }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka hantida go\'an la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/fixed-assets - Ku dar hanti cusub
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { 
      name, type, value, purchaseDate, assignedTo, status, depreciationRate, accountId, vendorId, note
    } = await request.json();
    if (!name || !type || typeof value !== 'number' || value <= 0 || !purchaseDate || typeof depreciationRate !== 'number' || depreciationRate < 0 || depreciationRate > 1) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca, Qiimaha, Taariikhda Gadashada, Qiimaha Hoos U Dhaca (0-1).' },
        { status: 400 }
      );
    }
    if (isNaN(new Date(purchaseDate).getTime())) {
      return NextResponse.json(
        { message: 'Taariikhda gadashada waa inuu noqdaa taariikh sax ah.' },
        { status: 400 }
      );
    }
    const existingAsset = await prisma.fixedAsset.findUnique({
      where: { name_companyId: { name: name, companyId } },
    });
    if (existingAsset) {
      return NextResponse.json(
        { message: 'Hantidan horey ayay u jirtay.' },
        { status: 409 }
      );
    }
    const yearsInUse = (new Date().getFullYear() - new Date(purchaseDate).getFullYear());
    const initialBookValue = value;
    const currentBookValue = Math.max(0, initialBookValue - (initialBookValue * depreciationRate * yearsInUse));
    const newAsset = await prisma.fixedAsset.create({
      data: {
        name,
        type,
        value: new Decimal(value),
        purchaseDate: new Date(purchaseDate),
        assignedTo: assignedTo || null,
        status: status || 'Active',
        depreciationRate: depreciationRate,
        currentBookValue: new Decimal(currentBookValue),
        companyId,
      },
    });

    // FIX: If accountId is provided, create transaction and deduct from account balance
    let createdTransaction: any = null;
    if (accountId && Number(value) > 0) {
      // Verify account exists
      const account = await prisma.account.findFirst({ 
        where: { id: accountId, companyId } 
      });
      
      if (!account) {
        return NextResponse.json(
          { message: 'Account-ka lama helin.' },
          { status: 400 }
        );
      }

      // Create transaction
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
        },
      });

      // Deduct from account balance
      await prisma.account.update({
        where: { id: accountId },
        data: { balance: { decrement: Number(value) } },
      });
    }

    return NextResponse.json(
      { 
        message: 'Hantida si guul leh ayaa loo daray!', 
        asset: newAsset,
        transaction: createdTransaction
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka hantida go\'an la darayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
