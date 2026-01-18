import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/receivables/pay
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { customerId, invoiceId, amount, accountId, notes } = body;

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }
        if (!accountId) {
            return NextResponse.json({ error: 'Destination account is required' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            let remainingAmount = Number(amount);

            // 1. Determine Invoices to Pay
            let invoicesToPay = [];

            if (invoiceId) {
                const inv = await tx.sale.findUnique({ where: { id: invoiceId } }) as any;
                if (inv) invoicesToPay.push(inv);
            } else if (customerId) {
                // Fetch oldest unpaid invoices
                invoicesToPay = await tx.sale.findMany({
                    where: {
                        customerId,
                        // @ts-ignore
                        paymentStatus: { in: ['Unpaid', 'Partial'] }
                    },
                    orderBy: { createdAt: 'asc' } // Older first
                }) as any[];
            } else {
                throw new Error('Must provide invoiceId or customerId');
            }

            // 2. Apply Payment
            for (const inv of invoicesToPay) {
                if (remainingAmount <= 0) break;

                const due = inv.total - (inv.paidAmount || 0);
                if (due <= 0) continue; // Skip fully paid if any slipped through

                const pay = Math.min(due, remainingAmount);
                const newPaid = (inv.paidAmount || 0) + pay;
                const newStatus = newPaid >= inv.total ? 'Paid' : 'Partial';

                await tx.sale.update({
                    where: { id: inv.id },
                    data: {
                        // @ts-ignore
                        paidAmount: newPaid,
                        // @ts-ignore
                        paymentStatus: newStatus
                    }
                });

                remainingAmount -= pay;
            }

            if (remainingAmount > 0 && customerId) {
                // Overpayment logic? For now, we just ignore or store as credit?
                // Let's assume exact or partial payments for now.
                // Or maybe create a "Credit" record. Keeping it simple: Just loose specific linkage but record transaction.
            }

            // 3. Update Account Balance (Add Money)
            await tx.account.update({
                where: { id: accountId },
                data: { balance: { increment: Number(amount) } }
            });

            // 4. Record Ledger Transaction
            await tx.transaction.create({
                data: {
                    description: notes || `Debt Collection from ${customerId ? 'Customer' : 'Invoice'}`,
                    amount: Number(amount),
                    type: 'INCOME',
                    category: 'Accounts Receivable',
                    accountId: accountId,
                    companyId: user.companyId,
                    userId: session.user.id,
                    transactionDate: new Date()
                }
            });
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
    }
}
