import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { sendShopReceiptViaWhatsApp } from '@/lib/whatsapp/send-shop-receipt';

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

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { company: true }
        });

        if (!currentUser?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        const updatedSales = await prisma.$transaction(async (tx) => {
            let remainingAmount = Number(amount);

            // 1. Determine Invoices to Pay
            let invoicesToPay = [];
            let successfullyUpdatedSales: any[] = [];

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

                const updatedSale = await tx.sale.update({
                    where: { id: inv.id },
                    data: {
                        // @ts-ignore
                        paidAmount: newPaid,
                        // @ts-ignore
                        paymentStatus: newStatus
                    },
                    include: {
                        customer: true,
                        items: true,
                        user: true,
                        company: true
                    }
                });

                successfullyUpdatedSales.push({ sale: updatedSale, payAmount: pay });

                // Record Ledger Transaction for this specific invoice payment
                await tx.transaction.create({
                    data: {
                        description: notes ? `${notes} (Invoice #${inv.invoiceNumber})` : `Payment for Invoice #${inv.invoiceNumber}`,
                        amount: Number(pay),
                        type: 'INCOME',
                        category: 'Accounts Receivable',
                        accountId: accountId,
                        companyId: currentUser.companyId,
                        userId: session.user.id,
                        transactionDate: new Date(),
                        note: `Ref Sale: ${inv.id}`
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
            return successfullyUpdatedSales;
        });

        // Trigger WhatsApp auto-send for all successfully updated invoices
        for (const { sale, payAmount } of updatedSales) {
            if (sale.customer && sale.customer.phone && currentUser.company?.name) {
                sendShopReceiptViaWhatsApp(
                    currentUser.companyId,
                    currentUser.company.name,
                    sale.customer.phone,
                    sale,
                    'PAYMENT',
                    payAmount
                ).catch(e => {
                    console.error('Failed to auto-send WhatsApp for payment:', e);
                });
            }
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: error.message || 'Payment failed' }, { status: 500 });
    }
}
