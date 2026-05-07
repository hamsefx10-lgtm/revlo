import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

// GET /api/shop/accounting/chart

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Date Range: Last 7 Days
        const startDate = startOfDay(subDays(new Date(), 6));

        const latestRateObj = await prisma.exchangeRate.findFirst({
            where: { companyId: user.companyId },
            orderBy: { date: 'desc' }
        });
        const exchangeRate = latestRateObj?.rate || 1;

        // Fetch Transactions
        const transactions = await prisma.transaction.findMany({
            where: {
                companyId: user.companyId,
                transactionDate: { gte: startDate },
                type: { in: ['INCOME', 'EXPENSE'] }
            },
            select: {
                transactionDate: true,
                amount: true,
                type: true,
                account: { select: { currency: true } },
                fromAccount: { select: { currency: true } },
                toAccount: { select: { currency: true } }
            }
        });

        // Initialize Chart Data
        const chartData = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
                name: format(d, 'EEE'), // Mon, Tue...
                date: format(d, 'yyyy-MM-dd'),
                income: 0,
                expense: 0
            };
        });

        // Aggregate
        transactions.forEach(t => {
            const dateStr = format(t.transactionDate, 'yyyy-MM-dd');
            const day = chartData.find(d => d.date === dateStr);
            if (day) {
                const accCurrency = t.account?.currency || t.fromAccount?.currency || t.toAccount?.currency || 'ETB';
                const finalAmount = accCurrency === 'USD' ? Math.abs(Number(t.amount)) * exchangeRate : Math.abs(Number(t.amount));

                if (t.type === 'INCOME') day.income += finalAmount;
                else if (t.type === 'EXPENSE') day.expense += finalAmount;
            }
        });

        return NextResponse.json({ chartData });

    } catch (error) {
        console.error('Error fetching accounting chart:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
