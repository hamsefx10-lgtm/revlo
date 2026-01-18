import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

// GET /api/shop/accounting/chart
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
                type: true
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
                if (t.type === 'INCOME') day.income += Number(t.amount);
                else if (t.type === 'EXPENSE') day.expense += Number(t.amount);
            }
        });

        return NextResponse.json({ chartData });

    } catch (error) {
        console.error('Error fetching accounting chart:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
