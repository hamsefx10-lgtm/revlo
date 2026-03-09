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
            const purchaseOrder = await tx.purchaseOrder.findUnique({
                where: { id },
                select: { currency: true, exchangeRate: true, total: true, paidAmount: true, poNumber: true, vendorId: true, id: true }
            });
            if (!purchaseOrder) throw new Error('Purchase Order not found');

            const account = accountId ? await tx.account.findUnique({ where: { id: accountId } }) : null;

            // 1. Calculate Deductions
            // The 'amount' sent from frontend is in the PO's currency.
            const amountInPOCurrency = paidAmount;

            // How much to increment the PO's paidAmount (which is always in ETB)
            let incrementPaidAmountETB = 0;
            if (purchaseOrder.currency === 'USD') {
                incrementPaidAmountETB = amountInPOCurrency * (purchaseOrder.exchangeRate || 1);
            } else {
                incrementPaidAmountETB = amountInPOCurrency;
            }

            // How much to deduct from the Account (in the Account's currency)
            let deductionFromAccount = 0;
            if (account) {
                if (account.currency === purchaseOrder.currency) {
                    deductionFromAccount = amountInPOCurrency;
                } else if (account.currency === 'ETB' && purchaseOrder.currency === 'USD') {
                    // Smart Payment: Paying USD order from ETB account
                    const rate = parseFloat(body.exchangeRate) || purchaseOrder.exchangeRate || 1;
                    deductionFromAccount = amountInPOCurrency * rate;
                } else if (account.currency === 'USD' && purchaseOrder.currency === 'ETB') {
                    // Paying ETB order from USD account
                    const rate = parseFloat(body.exchangeRate) || purchaseOrder.exchangeRate || 1;
                    deductionFromAccount = amountInPOCurrency / rate;
                }

                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: deductionFromAccount } }
                });
            }

            // 2. Create Expense (Records the deduction in the system's base currency - ETB)
            // Note: Expense amount is usually the actual cost incurred in ETB
            const totalCostETB = account?.currency === 'ETB' ? deductionFromAccount : incrementPaidAmountETB;

            await tx.expense.create({
                data: {
                    description: `Payment for PO ${purchaseOrder.poNumber}`,
                    amount: totalCostETB,
                    paidFrom: method || (account ? `Account: ${account.name}` : 'Cash'),
                    category: 'Purchase Payment',
                    expenseDate: new Date(),
                    note: notes,
                    companyId: user.companyId,
                    userId: session.user.id,
                    purchaseOrderId: purchaseOrder.id,
                    vendorId: purchaseOrder.vendorId,
                    accountId: accountId || null,
                    approved: true
                }
            });

            // 3. Create Transaction (Ledger Entry)
            await tx.transaction.create({
                data: {
                    companyId: user.companyId,
                    userId: session.user.id,
                    description: `Payment for PO #${purchaseOrder.poNumber}${purchaseOrder.currency === 'USD' ? ` ($${amountInPOCurrency})` : ''}`,
                    amount: totalCostETB,
                    type: 'EXPENSE',
                    category: 'Purchase Payment',
                    accountId: accountId || undefined,
                    transactionDate: new Date(),
                    note: notes,
                }
            });

            // 4. Update PO
            const newPaidTotal = (purchaseOrder.paidAmount || 0) + incrementPaidAmountETB;
            let paymentStatus = 'Unpaid';
            if (newPaidTotal >= purchaseOrder.total - 0.01) paymentStatus = 'Paid'; // Small delta for float precision
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
