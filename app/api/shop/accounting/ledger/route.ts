import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user to get companyId
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User does not belong to a company' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const accountId = searchParams.get('accountId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const whereClause: any = { companyId: user.companyId };

        if (accountId && accountId !== 'all') {
            whereClause.OR = [
                { accountId: accountId },
                { fromAccountId: accountId },
                { toAccountId: accountId }
            ];
        }

        if (startDate && endDate) {
            whereClause.transactionDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                account: true,
                fromAccount: true,
                toAccount: true
            },
            orderBy: { transactionDate: 'desc' },
            take: 100
        });

        const formatted = transactions.map(t => {
            const accountName = t.account?.name || t.fromAccount?.name || t.toAccount?.name || 'Unknown';
            // Simple heuristics for type. 
            // In a real double-entry, we'd check if account matches debit or credit side.
            // Here we assume if transaction amount is positive for this account filter, it's Debit?
            // Since we list ALL transactions, lets just show the raw type/amount.

            return {
                id: t.id,
                date: t.transactionDate,
                description: t.description,
                account: accountName,
                type: Number(t.amount) >= 0 ? 'Debit' : 'Credit', // Simplified
                amount: Math.abs(Number(t.amount)),
                reference: t.expenseId ? 'EXP' : t.projectId ? 'PROJ' : '-',
                category: t.category || 'General'
            };
        });

        return NextResponse.json({ entries: formatted });
    } catch (error) {
        console.error('Error fetching ledger:', error);
        return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
    }
}
