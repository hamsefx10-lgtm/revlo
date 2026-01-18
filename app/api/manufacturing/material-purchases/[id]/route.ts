import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// DELETE /api/manufacturing/material-purchases/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    // Note: Deleting purchase does NOT revert inventory automatically (safety)
    await prisma.materialPurchase.delete({
      where: { id: params.id, companyId }
    });

    return NextResponse.json({ message: 'Purchase deleted' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ message: 'Error deleting purchase' }, { status: 500 });
  }
}
