/**
 * Approve Pending Expense
 * Creates expense in system from approved Telegram message
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ExpenseFromTelegram } from '@/lib/expense-from-telegram';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { projectId, accountId } = await request.json().catch(() => ({}));

    const result = await ExpenseFromTelegram.createExpense({
      pendingExpenseId: id,
      companyId: session.user.companyId,
      userId: session.user.id,
      projectId,
      accountId,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create expense' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Expense approved and created successfully', expenseId: result.expenseId },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error approving expense:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

