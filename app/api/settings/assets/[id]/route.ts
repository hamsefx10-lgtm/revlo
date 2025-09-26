import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../../admin/auth';
import prisma from '@/lib/db';

// PUT /api/settings/assets/[id] - Update fixed asset
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, value, purchaseDate, assignedTo } = await request.json();

    if (!name || !type || !value || !purchaseDate) {
      return NextResponse.json(
        { message: 'Name, type, value, and purchase date are required' },
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
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await prisma.fixedAsset.delete({
      where: { 
        id: params.id,
        companyId 
      },
    });

    return NextResponse.json({ 
      message: 'Asset deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { message: 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

