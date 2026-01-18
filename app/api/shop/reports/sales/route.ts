import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const from = fromParam ? new Date(fromParam) : startOfDay(new Date());
        const to = toParam ? new Date(toParam) : endOfDay(new Date());

        const sales = await prisma.sale.findMany({
            where: {
                userId: session.user.id,
                createdAt: {
                    gte: from,
                    lte: to
                }
            }
        });

        // Calculate Stats
        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalTax = sales.reduce((sum, s) => sum + s.tax, 0);
        const transactionCount = sales.length;
        const avgTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        // Chart Data (Aggregated by Day)
        // Ensure all days in range are represented
        const days = eachDayOfInterval({ start: from, end: to });
        const chartData = days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            // Filter sales for this day
            const daySales = sales.filter(s => format(s.createdAt, 'yyyy-MM-dd') === dayStr);
            const dailyTotal = daySales.reduce((sum, s) => sum + s.total, 0);
            return {
                date: format(day, 'MMM dd'),
                revenue: dailyTotal,
                orders: daySales.length
            };
        });

        return NextResponse.json({
            stats: {
                revenue: totalRevenue,
                tax: totalTax,
                transactions: transactionCount,
                avgValue: avgTransaction
            },
            chartData
        });

    } catch (error) {
        console.error('Error fetching sales report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
