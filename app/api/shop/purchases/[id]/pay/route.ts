import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/purchases/[id]/pay
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { amount, method, notes, accountId } = body;

        const paidAmount = parseFloat(amount);
        if (isNaN(paidAmount) || paidAmount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        // Fetch PO
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            select: {
                id: true,
                poNumber: true,
                vendorId: true,
                total: true,
                paidAmount: true
            }
        });

        if (!po) {
            return NextResponse.json({ error: 'PO not found' }, { status: 404 });
        }

        // Fetch User Company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        // Update within Transaction
        const updatedPO = await prisma.$transaction(async (tx) => {

            // 1. Deduct from Account if selected
            if (accountId) {
                const account = await tx.account.findUnique({ where: { id: accountId } });
                if (!account) throw new Error('Account not found');

                if (account.balance < paidAmount) {
                    // Optional: Throw error if insufficient funds? User might want to allow negative.
                    // For now allowing negative or user choice.
                }

                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: paidAmount } }
                });
            }

            // 2. Create Expense
            await tx.expense.create({
                data: {
                    description: `Payment for PO ${po.poNumber}`,
                    amount: paidAmount,
                    paidFrom: method || 'Cash',
                    category: 'Purchase Payment',
                    expenseDate: new Date(),
                    note: notes,
                    companyId: user.companyId,
                    userId: session.user.id,
                    purchaseOrderId: po.id,
                    vendorId: po.vendorId,
                    accountId: accountId || null, // Link to account
                    approved: true
                }
            });

            // 3. Create Transaction (Ledger Entry)
            // This is critical for the Balance Sheet to reflect the cash outflow
            await tx.transaction.create({
                data: {
                    companyId: user.companyId,
                    userId: session.user.id,
                    description: `Payment for PO #${po.poNumber}`,
                    amount: paidAmount, // Transaction amount
                    type: 'EXPENSE', // Type: Expense (Cash Out)
                    category: 'Purchase Payment',
                    accountId: accountId || undefined, // Link to the funding account
                    transactionDate: new Date(),
                    note: notes,
                    // If your schema supports vendorId on transaction, add it:
                    // vendorId: po.vendorId
                }
            });

            // 4. Update PO
            const newPaidTotal = (po.paidAmount || 0) + paidAmount;
            let paymentStatus = 'Unpaid';
            if (newPaidTotal >= po.total) paymentStatus = 'Paid';
            else if (newPaidTotal > 0) paymentStatus = 'Partial';

            return await tx.purchaseOrder.update({
                where: { id },
                data: {
                    paidAmount: newPaidTotal,
                    paymentStatus
                }
            });
        });

        return NextResponse.json({ success: true, purchaseOrder: updatedPO });

    } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
