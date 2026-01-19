// app/api/sales/[id]/route.ts - Single Sale operations
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/sales/[id] - Get single sale details
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const sale = await prisma.transaction.findUnique({
            where: { id },
            include: {
                customer: true,
                account: true,
            }
        });

        if (!sale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        if (sale.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json({ sale });
    } catch (error) {
        console.error('Error fetching sale:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/sales/[id] - Update sale
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await request.json();
        const { totalAmount, accountId, saleDate, notes, customerId } = body;

        // 1. Get existing transaction to handle balance updates
        const existingSale = await prisma.transaction.findUnique({
            where: { id },
            include: { account: true }
        });

        if (!existingSale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        if (existingSale.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Only allow editing INCOME transactions
        if (existingSale.type !== 'INCOME') {
            return NextResponse.json({ error: 'Only sales (INCOME) can be edited here.' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Revert previous effect on account balance
            if (existingSale.accountId) {
                await tx.account.update({
                    where: { id: existingSale.accountId },
                    data: { balance: { decrement: Number(existingSale.amount) } }
                });
            }

            // Update the transaction
            const updatedSale = await tx.transaction.update({
                where: { id },
                data: {
                    amount: Number(totalAmount),
                    accountId,
                    customerId: customerId || null,
                    transactionDate: saleDate ? new Date(saleDate) : existingSale.transactionDate,
                    note: notes || null,
                }
            });

            // Apply new effect on account balance
            await tx.account.update({
                where: { id: accountId },
                data: { balance: { increment: Number(totalAmount) } }
            });

            return updatedSale;
        });

        return NextResponse.json({ message: 'Sale updated successfully' });

    } catch (error) {
        console.error('Error updating sale:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/sales/[id] - Delete sale
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const existingSale = await prisma.transaction.findUnique({
            where: { id },
            include: { account: true }
        });

        if (!existingSale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        if (existingSale.companyId !== session.user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        if (existingSale.type !== 'INCOME') {
            return NextResponse.json({ error: 'Only sales (INCOME) can be deleted here.' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            // Revert effect on account balance (Deduct the income amount)
            if (existingSale.accountId) {
                await tx.account.update({
                    where: { id: existingSale.accountId },
                    data: { balance: { decrement: Number(existingSale.amount) } }
                });
            }

            // Delete transaction
            await tx.transaction.delete({
                where: { id }
            });
        });

        return NextResponse.json({ message: 'Sale deleted successfully' });

    } catch (error) {
        console.error('Error deleting sale:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
