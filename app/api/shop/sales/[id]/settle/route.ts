import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { sendShopReceiptViaWhatsApp } from '@/lib/whatsapp/send-shop-receipt';

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { amount, accountId, description, paymentDate, exchangeRate } = body;

        if (!amount || amount <= 0 || !accountId) {
            console.error('SETTLE API - Invalid payload');
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { company: true }
        });

        if (!currentUser?.companyId) {
            console.error('SETTLE API - User has no company');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const sale = await prisma.sale.findUnique({
            where: { id: params.id },
            include: { customer: true }
        });

        if (!sale || sale.companyId !== currentUser.companyId) {
            console.error('SETTLE API - Sale not found or mismatch');
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        console.log('SETTLE API - Found Sale:', sale.invoiceNumber);

        const remainingBalance = sale.total - sale.paidAmount;
        if (amount > remainingBalance + 0.05) { // Slightly larger buffer
            console.error('SETTLE API - Amount exceeds balance:', amount, '>', remainingBalance);
            return NextResponse.json({ error: 'Amount exceeds remaining balance' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            console.log('SETTLE API - Starting transaction...');
            // 1. Update Sale
            const newPaidAmount = Number(sale.paidAmount) + Number(amount);
            const newStatus = newPaidAmount >= sale.total - 0.01 ? 'Paid' : 'Partial';

            const updatedSale = await tx.sale.update({
                where: { id: params.id },
                data: {
                    paidAmount: newPaidAmount,
                    paymentStatus: newStatus
                }
            });

            console.log('SETTLE API - Sale updated');

            // Determine the actual amount to deposit in the account (Assuming accounts are usually in ETB)
            // If the sale is in USD, the cash received is amount * rate
            const activeRate = exchangeRate || 1;
            const depositAmount = sale.currency === 'USD' ? (amount * activeRate) : amount;

            // 2. Update Account
            await tx.account.update({
                where: { id: accountId },
                data: {
                    balance: { increment: depositAmount }
                }
            });

            // 3. Create Transaction
            await tx.transaction.create({
                data: {
                    type: 'INCOME',
                    amount: depositAmount, // Store the ETB equivalent in transactions
                    description: description || `Payment for Invoice #${sale.invoiceNumber} (${amount} ${sale.currency})`,
                    category: 'Sales Receipt',
                    transactionDate: paymentDate ? new Date(paymentDate) : new Date(),
                    accountId: accountId,
                    userId: session.user.id,
                    companyId: currentUser.companyId,
                    note: `Ref Sale: ${sale.id} | Rate: ${activeRate}`
                }
            });

            console.log('SETTLE API - Transaction created');
            return updatedSale;
        });

        // --- WhatsApp Receipt Trigger ---
        try {
            const finalSaleForAPI = await prisma.sale.findUnique({
                where: { id: params.id },
                include: { customer: true, items: true }
            });
            if (finalSaleForAPI && finalSaleForAPI.customer?.phone && currentUser.company?.name) {
                // Pass 'PAYMENT' and the amount paid
                sendShopReceiptViaWhatsApp(
                    currentUser.companyId,
                    currentUser.company.name,
                    finalSaleForAPI.customer.phone,
                    finalSaleForAPI,
                    'PAYMENT',
                    Number(amount)
                ).catch(e => console.error('Failed to send WhatsApp payment receipt:', e));
            }
        } catch (waErr) {
            console.error('WhatsApp hook failed silently:', waErr);
        }

        console.log('SETTLE API - Success');
        return NextResponse.json({ success: true, sale: result });
    } catch (error: any) {
        console.error('Error settling sale:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
