import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        const body = await req.json();
        const { fromAccountId, toAccountId, amount, date, description } = body;

        if (!fromAccountId || !toAccountId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid transfer details' }, { status: 400 });
        }

        if (fromAccountId === toAccountId) {
            return NextResponse.json({ error: 'Cannot transfer to same account' }, { status: 400 });
        }

        // Perform Transfer Transaction
        await prisma.$transaction(async (tx) => {
            // 1. Check Balance
            const fromAccount = await tx.account.findUnique({ where: { id: fromAccountId } });
            if (!fromAccount || fromAccount.balance < amount) {
                throw new Error('Insufficient funds in source account');
            }

            const toAccount = await tx.account.findUnique({ where: { id: toAccountId } });
            if (!toAccount) throw new Error('Destination account not found');

            // 2. Debit Source
            await tx.account.update({
                where: { id: fromAccountId },
                data: { balance: { decrement: amount } }
            });

            // 3. Credit Destination
            await tx.account.update({
                where: { id: toAccountId },
                data: { balance: { increment: amount } }
            });

            // 4. Create Transaction Records (Linked if possible, but distinct mostly)
            const transferRef = `TRF-${Date.now()}`;

            // Outgoing
            await tx.transaction.create({
                data: {
                    type: 'EXPENSE', // Or 'TRANSFER_OUT' if enum allows. Using EXPENSE for now as it reduces balance.
                    category: 'Transfer Out',
                    amount: amount,
                    description: description || `Transfer to ${toAccount.name}`,
                    accountId: fromAccountId,
                    // date: new Date(date || Date.now()), // 'date' field does not exist on Transaction model
                    transactionDate: new Date(date || Date.now()),
                    companyId: user.companyId,
                    userId: session.user.id,
                    note: `Ref: ${transferRef}`
                }
            });

            // Incoming
            await tx.transaction.create({
                data: {
                    type: 'INCOME', // Or 'TRANSFER_IN'
                    category: 'Transfer In',
                    amount: amount,
                    description: description || `Transfer from ${fromAccount.name}`,
                    accountId: toAccountId,
                    transactionDate: new Date(date || Date.now()),
                    companyId: user.companyId,
                    userId: session.user.id,
                    note: `Ref: ${transferRef}`
                }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Transfer Error:', error);
        return NextResponse.json({ error: error.message || 'Transfer failed' }, { status: 500 });
    }
}
