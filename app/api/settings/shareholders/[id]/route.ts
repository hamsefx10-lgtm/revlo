import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../../admin/auth';
import prisma from '@/lib/db';

// PUT /api/settings/shareholders/[id] - Update shareholder
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, sharePercentage, joinedDate } = await request.json();

    if (!name || !email || !sharePercentage || !joinedDate) {
      return NextResponse.json(
        { message: 'Name, email, share percentage, and joined date are required' },
        { status: 400 }
      );
    }

    const shareholder = await prisma.shareholder.update({
      where: { 
        id: params.id,
        companyId 
      },
      data: {
        name,
        email,
        sharePercentage: parseFloat(sharePercentage),
        joinedDate: new Date(joinedDate),
      },
    });

    return NextResponse.json({ 
      shareholder,
      message: 'Shareholder updated successfully' 
    });
  } catch (error) {
    console.error('Error updating shareholder:', error);
    return NextResponse.json(
      { message: 'Failed to update shareholder' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/shareholders/[id] - Delete shareholder
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await prisma.shareholder.delete({
      where: { 
        id: params.id,
        companyId 
      },
    });

    return NextResponse.json({ 
      message: 'Shareholder deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting shareholder:', error);
    return NextResponse.json(
      { message: 'Failed to delete shareholder' },
      { status: 500 }
    );
  }
}

