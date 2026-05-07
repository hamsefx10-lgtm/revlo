import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!currentUser?.companyId) {
            return NextResponse.json({ error: 'User does not belong to a company' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const fromParam = searchParams.get('from');
        const toParam = searchParams.get('to');

        const from = fromParam ? new Date(fromParam) : startOfDay(new Date());
        const to = toParam ? new Date(toParam) : endOfDay(new Date());

        const sales = await prisma.sale.findMany({
            where: {
                companyId: currentUser.companyId,
                createdAt: { gte: from, lte: to }
            }
        });

        // Calculate Stats (all in ETB)
        const totalRevenue = sales.reduce((sum, s) => {
            const saleTotalInETB = s.currency === 'USD' ? (s.total * (s.exchangeRate || 1)) : s.total;
            return sum + saleTotalInETB;
        }, 0);

        const totalTax = sales.reduce((sum, s) => {
            const taxInETB = s.currency === 'USD' ? (s.tax * (s.exchangeRate || 1)) : s.tax;
            return sum + taxInETB;
        }, 0);

        const transactionCount = sales.length;
        const avgTransaction = transactionCount > 0 ? totalRevenue / transactionCount : 0;

        // Chart Data (Aggregated by Day)
        const days = eachDayOfInterval({ start: from, end: to });
        const chartData = days.map(day => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const daySales = sales.filter(s => format(new Date(s.createdAt), 'yyyy-MM-dd') === dayStr);
            const dailyTotal = daySales.reduce((sum, s) => {
                const saleTotalInETB = s.currency === 'USD' ? (s.total * (s.exchangeRate || 1)) : s.total;
                return sum + saleTotalInETB;
            }, 0);
            return {
                date: format(day, 'MMM dd'),
                revenue: dailyTotal,
                orders: daySales.length
            };
        });

        // ── Previous period comparison (dynamic trend %) ──
        const durationMs = to.getTime() - from.getTime();
        const prevFrom = new Date(from.getTime() - durationMs);
        const prevTo = new Date(from.getTime() - 1);

        const prevSales = await prisma.sale.findMany({
            where: {
                companyId: currentUser.companyId,
                createdAt: { gte: prevFrom, lte: prevTo }
            },
            select: { total: true, currency: true, exchangeRate: true }
        });

        const prevRevenue = prevSales.reduce((sum, s) => {
            const v = s.currency === 'USD' ? (s.total * (s.exchangeRate || 1)) : s.total;
            return sum + v;
        }, 0);
        const prevTransactions = prevSales.length;
        const prevAvg = prevTransactions > 0 ? prevRevenue / prevTransactions : 0;

        const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const transactionGrowth = prevTransactions > 0 ? ((transactionCount - prevTransactions) / prevTransactions) * 100 : 0;
        const avgGrowth = prevAvg > 0 ? ((avgTransaction - prevAvg) / prevAvg) * 100 : 0;

        return NextResponse.json({
            stats: {
                revenue: totalRevenue,
                tax: totalTax,
                transactions: transactionCount,
                avgValue: avgTransaction,
                revenueGrowth: Math.round(revenueGrowth * 10) / 10,
                transactionGrowth: Math.round(transactionGrowth * 10) / 10,
                avgGrowth: Math.round(avgGrowth * 10) / 10,
            },
            chartData
        });

    } catch (error) {
        console.error('Error fetching sales report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
