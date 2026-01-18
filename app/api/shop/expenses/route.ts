import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/expenses - Create new expense with Accounting Entries
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { description, amount, category, date, accountId, notes, note, employeeId } = body;

        if (!description || !amount || !category || !accountId) {
            return NextResponse.json({ error: 'Missing required fields (description, amount, category, accountId)' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Verify Account & Balance
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account) throw new Error("Account not found");

            // Optional: Prevent negative balance? For now allow it, just warn.

            // 2. Create Expense Record
            const expense = await tx.expense.create({
                data: {
                    description,
                    amount: parseFloat(amount),
                    category,
                    paidFrom: account.name, // Legacy field
                    accountId: account.id, // Link to real account
                    expenseDate: new Date(date || new Date()),
                    note: notes || note,
                    approved: true,
                    userId: session.user.id,
                    companyId: user.companyId,
                    employeeId: employeeId || undefined // Link to Employee if provided
                }
            });

            // 3. Update Account Balance (Deduct Money)
            await tx.account.update({
                where: { id: accountId },
                data: { balance: { decrement: parseFloat(amount) } }
            });

            // 4. Create Ledger Entry (Transaction)
            await tx.transaction.create({
                data: {
                    description: `Expense: ${description}`,
                    amount: parseFloat(amount),
                    type: 'EXPENSE',
                    accountId: account.id,
                    expenseId: expense.id,
                    companyId: user.companyId,
                    userId: session.user.id,
                    transactionDate: new Date(date || new Date()),
                    category: category,
                    employeeId: employeeId || undefined // Link transaction too
                }
            });

            return expense;
        });

        return NextResponse.json({ expense: result }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
