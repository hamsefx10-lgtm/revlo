import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/shop/accounts/[id] - Get Account Details & Summary
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;

        const account = await prisma.account.findUnique({
            where: { id },
            include: {
                transactions: {
                    orderBy: { transactionDate: 'desc' },
                    take: 10, // Just a preview, the page will fetch more if needed
                    include: {
                        project: { select: { name: true } },
                        customer: { select: { name: true } },
                        vendor: { select: { name: true } },
                        employee: { select: { fullName: true } }
                    }
                }
            }
        });

        if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

        // Calculate Summaries
        // NOTE: This usually would be better done via aggregation but this works for now
        const allTrx = await prisma.transaction.findMany({
            where: { accountId: id },
            select: { amount: true, type: true }
        });

        let totalIn = 0;
        let totalOut = 0;

        allTrx.forEach((t: any) => {
            const amount = Number(t.amount);
            if (t.type === 'INCOME') totalIn += amount;
            else if (t.type === 'EXPENSE') totalOut += amount;
            // Note: Transfers are handled by INCOME/EXPENSE types on each side
        });

        return NextResponse.json({
            account,
            summary: {
                totalIn,
                totalOut,
                netFlow: totalIn - totalOut
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch account details' }, { status: 500 });
    }
}

// PUT /api/shop/accounts/[id] - Update Account
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;
        const body = await req.json();
        const { name, type, description } = body;

        const account = await prisma.account.update({
            where: { id },
            data: { name, type, description }
        });

        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

// DELETE /api/shop/accounts/[id] - Delete Account
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = params;

        // Check for transactions
        const transactions = await prisma.transaction.count({
            where: { accountId: id }
        });

        if (transactions > 0) {
            // Alternatively, mark as inactive instead of delete?
            // For now, prevent delete.
            return NextResponse.json({ error: 'Cannot delete account with existing transactions.' }, { status: 400 });
        }

        await prisma.account.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
