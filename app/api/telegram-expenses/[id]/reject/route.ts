/**
 * Reject Pending Expense
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
    const { reason } = await request.json().catch(() => ({}));

    const result = await ExpenseFromTelegram.rejectExpense(
      id,
      session.user.id,
      reason
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to reject expense' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Expense rejected successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error rejecting expense:', error);
    return NextResponse.json(
      { error: error.message || 'Server error' },
      { status: 500 }
    );
  }
}

