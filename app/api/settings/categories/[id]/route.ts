import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../../admin/auth';
import prisma from '@/lib/db';

// PUT /api/settings/categories/[id] - Update expense category
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, description } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { message: 'Name and type are required' },
        { status: 400 }
      );
    }

    const category = await prisma.expenseCategory.update({
      where: { 
        id: params.id,
        companyId 
      },
      data: {
        name,
        type,
        description: description || '',
      },
    });

    return NextResponse.json({ 
      category,
      message: 'Category updated successfully' 
    });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/settings/categories/[id] - Delete expense category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await prisma.expenseCategory.delete({
      where: { 
        id: params.id,
        companyId 
      },
    });

    return NextResponse.json({ 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

