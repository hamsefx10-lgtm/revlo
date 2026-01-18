import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { accountId, reason } = body;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Get Sale
            const sale = await tx.sale.findUnique({
                where: { id: params.id },
                include: { items: true }
            });

            if (!sale) throw new Error("Sale not found");
            if (sale.status === 'Refunded') throw new Error("Sale already refunded");

            // Fetch User for Company ID (Crucial for Multi-tenancy)
            const user = await tx.user.findUnique({
                where: { id: session.user.id },
                select: { companyId: true }
            });
            if (!user?.companyId) throw new Error("User company not found");

            // 2. Update Sale Status
            await tx.sale.update({
                where: { id: sale.id },
                data: {
                    status: 'Refunded',
                    notes: sale.notes ? `${sale.notes}\nRefunded: ${reason || ''}` : `Refunded: ${reason || ''}`
                }
            });

            // 3. Stock Return
            for (const item of sale.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { increment: item.quantity },
                        status: 'In Stock'
                    }
                });

                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        type: 'Return',
                        quantity: item.quantity,
                        reference: sale.invoiceNumber,
                        userId: session.user.id
                    }
                });
            }

            // 4. Financial Refund (Ledger Entry)
            if (accountId) {
                await tx.account.update({
                    where: { id: accountId },
                    data: { balance: { decrement: sale.total } }
                });

                await tx.transaction.create({
                    data: {
                        description: `Refund - ${sale.invoiceNumber}`,
                        amount: sale.total,
                        type: 'EXPENSE', // Refunds are expenses/outflows
                        accountId: accountId,
                        companyId: user.companyId, // Use fetched companyId
                        userId: session.user.id,
                        category: 'Refunds',
                        transactionDate: new Date()
                    }
                });
            }

            return sale;
        });

        return NextResponse.json({ success: true, sale: result });

    } catch (error: any) {
        console.error("Refund error:", error);
        return NextResponse.json({ error: error.message || 'Refund failed' }, { status: 500 });
    }
}
