import { NextResponse } from 'next/server';
import { getSessionCompanyUser } from '@/lib/auth';
import prisma from '@/lib/db';

// PUT /api/settings/assets/[id] - Update fixed asset
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;
    const { id } = params;
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, value, purchaseDate, assignedTo, status, depreciationRate, currentBookValue } = await request.json();

    if (!name || !type || value === undefined || !purchaseDate) {
      return NextResponse.json(
        { message: 'Magaca, nooca, qiimaha, iyo taariikhda waa waajib' },
        { status: 400 }
      );
    }

    const asset = await prisma.fixedAsset.update({
      where: {
        id: params.id,
        companyId
      },
      data: {
        name,
        type,
        value: parseFloat(value),
        purchaseDate: new Date(purchaseDate),
        assignedTo: assignedTo || 'Office',
        status: status || 'Active',
        depreciationRate: depreciationRate !== undefined ? parseFloat(depreciationRate) : 0,
        currentBookValue: currentBookValue !== undefined ? parseFloat(currentBookValue) : parseFloat(value),
      },
    });

    return NextResponse.json({
      asset,
      message: 'Asset updated successfully'
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { message: 'Failed to update asset' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/assets/[id] - Delete fixed asset
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;
    const { id } = params;

    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 1) Find the asset first (for amount/name)
    const asset = await prisma.fixedAsset.findFirst({ where: { id: params.id, companyId } });
    if (!asset) {
      return NextResponse.json({ message: 'Asset not found' }, { status: 404 });
    }

    // 2) Try to find the related transaction by category and description
    const relatedTx = await prisma.transaction.findFirst({
      where: {
        companyId,
        category: 'FIXED_ASSET_PURCHASE',
        // match by description contains asset name and by amount
        description: { contains: asset.name },
        amount: asset.value as any,
      },
      orderBy: { transactionDate: 'desc' },
    });

    // 3) If transaction exists and has accountId, refund the account and delete the transaction
    if (relatedTx && relatedTx.accountId) {
      await prisma.account.update({
        where: { id: relatedTx.accountId },
        data: { balance: { increment: Number(relatedTx.amount) } },
      });
      await prisma.transaction.delete({ where: { id: relatedTx.id } });
    }

    // 4) Delete the asset
    await prisma.fixedAsset.delete({ where: { id: params.id } });

    return NextResponse.json({
      message: 'Asset deleted successfully and account refunded if a linked purchase transaction was found.'
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { message: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

