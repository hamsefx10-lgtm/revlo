
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/purchase-orders/pay
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
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const body = await req.json();
        const { poId, amount, accountId, date, description } = body;

        if (!poId || !amount || !accountId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const payAmount = parseFloat(amount);
        if (payAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch PO
            const po = await tx.purchaseOrder.findUnique({
                where: { id: poId },
                include: { vendor: true }
            });

            if (!po) throw new Error('Purchase Order not found');

            // 2. Fetch Account
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account) throw new Error('Account not found');

            if (account.balance < payAmount) {
                // throw new Error('Insufficient funds'); 
                // Allow negative balance? Usually yes for credit cards, maybe not for cash.
                // Let's allow it but maybe warn? For now, strict check? 
                // Supermarkets often overdraw or input sequentially wrong.
                // Let's NOT block for now, just allow negative. It helps fix errors easier.
            }

            // 3. Create Expense Record
            const expense = await tx.expense.create({
                data: {
                    description: description || `Payment for ${po.poNumber}`,
                    amount: payAmount,
                    // category: 'Cost of Goods Sold', // Prisma might complain if category is not valid Relational check?? 
                    // Wait, Expense model has `categoryId`. `category` is a String field in Expense?
                    // Let's check Schema line 329: `category String`. Okay.
                    category: 'Cost of Goods Sold',
                    paidFrom: account.name, // Required field based on schema line 318
                    expenseDate: date ? new Date(date) : new Date(),
                    companyId: user.companyId,
                    userId: session.user.id,
                    accountId: account.id,
                    purchaseOrderId: po.id // Relation is purchaseOrderId (single) or purchaseOrderIds (array check?)
                    // Schema line 354: `purchaseOrderId String?`. It's single.
                }
            });


            // 4. Update PO
            const newPaidTotal = po.paidAmount + payAmount;
            const newStatus = newPaidTotal >= po.total ? 'Paid' : 'Partial';

            await tx.purchaseOrder.update({
                where: { id: poId },
                data: {
                    paidAmount: { increment: payAmount },
                    paymentStatus: newStatus
                }
            });

            // 5. Update Account Balance
            await tx.account.update({
                where: { id: accountId },
                data: { balance: { decrement: payAmount } }
            });

            // 6. Create Transaction (Ledger)
            await tx.transaction.create({
                data: {
                    description: `Bill Payment: ${po.vendor.name} (${po.poNumber})`,
                    amount: payAmount,
                    type: 'EXPENSE',
                    accountId: account.id,
                    companyId: user.companyId,
                    transactionDate: new Date(),
                    expenseId: expense.id
                }
            });

            return { expense, newStatus, newPaidTotal };
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
