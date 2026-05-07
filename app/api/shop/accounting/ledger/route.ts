import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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

        const latestRateObj = await prisma.exchangeRate.findFirst({
            where: { companyId: user.companyId },
            orderBy: { date: 'desc' }
        });
        const exchangeRate = latestRateObj?.rate || 1;

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

        let totalIncome = 0;
        let totalExpense = 0;

        const formatted = transactions.map(t => {
            const accountName = t.account?.name || t.fromAccount?.name || t.toAccount?.name || 'Unknown';
            const accCurrency = t.account?.currency || t.fromAccount?.currency || t.toAccount?.currency || 'ETB';
            
            // Apply exchange rate if USD
            const finalAmount = accCurrency === 'USD' ? Math.abs(Number(t.amount)) * exchangeRate : Math.abs(Number(t.amount));
            
            let finalType = 'Expense';
            if (t.type === 'INCOME') finalType = 'Income';
            else if (t.type === 'EXPENSE') finalType = 'Expense';
            else if (Number(t.amount) >= 0) finalType = 'Income'; // Fallback

            if (finalType === 'Income') totalIncome += finalAmount;
            if (finalType === 'Expense') totalExpense += finalAmount;

            return {
                id: t.id,
                date: t.transactionDate,
                description: t.description,
                account: accountName,
                type: finalType,
                amount: finalAmount,
                reference: t.expenseId ? 'EXP' : t.projectId ? 'PROJ' : '-',
                category: t.category || 'General'
            };
        });

        const netProfit = totalIncome - totalExpense;

        return NextResponse.json({ 
            transactions: formatted,
            stats: {
                totalIncome,
                totalExpense,
                netProfit
            }
        });
    } catch (error) {
        console.error('Error fetching ledger:', error);
        return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
    }
}
