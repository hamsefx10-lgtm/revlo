
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/accounting/transfer
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { fromAccountId, toAccountId, amount, date, description } = body;

        if (!fromAccountId || !toAccountId || !amount || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (fromAccountId === toAccountId) {
            return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });
        }

        const transferAmount = parseFloat(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch Source Account to check balance
            const sourceAccount = await tx.account.findUnique({ where: { id: fromAccountId } });
            if (!sourceAccount) throw new Error("Source account not found");

            const destAccount = await tx.account.findUnique({ where: { id: toAccountId } });
            if (!destAccount) throw new Error("Destination account not found");

            // Optional: Check sufficiency (Allows overdraft? Let's allow for flexible entry but maybe warn? For now, strict check is safer for cash)
            // if (sourceAccount.balance < transferAmount) {
            //     throw new Error("Insufficient funds in source account");
            // }

            // 2. Decrement Source
            await tx.account.update({
                where: { id: fromAccountId },
                data: { balance: { decrement: transferAmount } }
            });

            // 3. Increment Destination
            await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: transferAmount } }
            });

            // 4. Create Transfer Out Record
            await tx.transaction.create({
                data: {
                    description: description || `Transfer to ${destAccount.name}`,
                    amount: transferAmount,
                    type: 'TRANSFER_OUT', // Enum value
                    accountId: fromAccountId,
                    // Link accounts for reference
                    fromAccountId: fromAccountId,
                    toAccountId: toAccountId,
                    companyId: user.companyId,
                    userId: session.user.id,
                    transactionDate: new Date(date),
                    category: 'Transfer'
                }
            });

            // 5. Create Transfer In Record
            await tx.transaction.create({
                data: {
                    description: description || `Transfer from ${sourceAccount.name}`,
                    amount: transferAmount,
                    type: 'TRANSFER_IN', // Enum value
                    accountId: toAccountId,
                    // Link accounts for reference
                    fromAccountId: fromAccountId,
                    toAccountId: toAccountId,
                    companyId: user.companyId,
                    userId: session.user.id,
                    transactionDate: new Date(date),
                    category: 'Transfer'
                }
            });

            return { success: true };
        });

        return NextResponse.json({ success: true, result }, { status: 201 });

    } catch (error: any) {
        console.error('Error processing transfer:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
