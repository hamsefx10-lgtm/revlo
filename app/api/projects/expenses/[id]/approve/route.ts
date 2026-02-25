// app/api/expenses/[id]/approve/route.ts - Expense Approval API
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// PUT /api/expenses/[id]/approve - Approve or reject an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const { approved } = await request.json();

    // Validate input
    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Approved field must be a boolean' },
        { status: 400 }
      );
    }

    // Check if expense exists and belongs to the company
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: id,
        companyId: session.user.companyId,
      },
    });

    if (!existingExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    // Update the expense approval status
    const updatedExpense = await prisma.expense.update({
      where: { id: id },
      data: { 
        approved: approved,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        approved: true,
        description: true,
        amount: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: approved ? 'Expense approved successfully' : 'Expense rejected successfully',
      expense: updatedExpense,
    });

  } catch (error: any) {
    console.error('Error updating expense approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
