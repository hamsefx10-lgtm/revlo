import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { accountId, reason, itemIds } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Sale with items
            const sale = await tx.sale.findUnique({
                where: { id: params.id },
                include: { items: true }
            });
            if (!sale) throw new Error('Sale not found');
            if (sale.status === 'Refunded') throw new Error('Sale already refunded');

            const user = await tx.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            if (!user?.companyId) throw new Error('User company not found');

            // 2. Determine which items to refund
            // If itemIds provided → partial refund; otherwise full refund
            const itemsToRefund = itemIds && itemIds.length > 0
                ? sale.items.filter(i => itemIds.includes(i.id))
                : sale.items;

            if (itemsToRefund.length === 0) throw new Error('No items selected for refund');

            const refundTotal = itemsToRefund.reduce((sum, i) => sum + Number(i.total), 0);
            const isFullRefund = itemsToRefund.length === sale.items.length;

            // 3. Update Sale status
            await tx.sale.update({
                where: { id: sale.id },
                data: {
                    status: isFullRefund ? 'Refunded' : 'PartialRefund',
                    notes: sale.notes
                        ? `${sale.notes}\nSoo celisi: ${reason || ''} | Lacag: ETB ${refundTotal.toLocaleString()}`
                        : `Soo celisi: ${reason || ''} | Lacag: ETB ${refundTotal.toLocaleString()}`
                }
            });

            // 4. Restore stock for returned items
            for (const item of itemsToRefund) {
                // Update product stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        status: 'In Stock'
                    }
                });

                // Log stock movement
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'Return',
                        quantity: item.quantity,
                        reference: `${sale.invoiceNumber} - REFUND`,
                        userId: session.user.id
                    }
                });
            }

            // 5. Financial entry — pay back customer from account
            if (accountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: refundTotal } }
                });

                await tx.transaction.create({
                    data: {
                        description: `Soo celinta - Invoice #${sale.invoiceNumber}${reason ? ` (${reason})` : ''}`,
                        amount: refundTotal,
                        type: 'EXPENSE',
                        accountId,
                        companyId: user.companyId,
                        userId: session.user.id,
                        category: 'Refunds',
                        transactionDate: new Date()
                    }
                });
            }

            return { sale, refundTotal, itemsRefunded: itemsToRefund.length, isFullRefund };
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('Refund error:', error);
        return NextResponse.json({ error: error.message || 'Refund failed' }, { status: 500 });
    }
}
