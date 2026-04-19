import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/shareholders/analytics
// Returns profit data + per-shareholder split based on sales in date range
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const { searchParams } = new URL(req.url);
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const dateFilter: any = {};
        if (from) dateFilter.gte = new Date(from);
        if (to) dateFilter.lte = new Date(new Date(to).setHours(23, 59, 59, 999));

        const companyId = user.companyId;

        // 1. Fetch all active shareholders
        const shareholders = await (prisma as any).shopShareholder.findMany({
            where: { companyId, status: 'Active' },
            include: {
                dividends: {
                    where: { status: 'Paid' },
                },
            },
        });

        // 2. Sales in period
        const sales = await (prisma as any).sale.findMany({
            where: {
                companyId,
                status: 'Completed',
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
            },
            include: { items: { select: { totalCost: true, total: true } } },
        });

        // 3. Calculate revenue and profit
        const totalRevenue = sales.reduce((s: number, sale: any) => s + Number(sale.total), 0);
        const totalCOGS = sales.reduce((s: number, sale: any) =>
            s + sale.items.reduce((is: number, item: any) => is + Number(item.totalCost || 0), 0), 0);
        const totalProfit = totalRevenue - totalCOGS;

        // 4. Per-shareholder split
        const shareholderData = shareholders.map((sh: any) => {
            const profitShare = totalProfit * (sh.sharePercentage / 100);
            const totalPaid = sh.dividends.reduce((s: number, d: any) => s + Number(d.amount), 0);
            const balance = profitShare - totalPaid;
            const roi = sh.initialInvestment > 0
                ? ((Number(sh.totalReceived) / Number(sh.initialInvestment)) * 100)
                : 0;

            return {
                id: sh.id,
                name: sh.name,
                email: sh.email,
                sharePercentage: sh.sharePercentage,
                initialInvestment: Number(sh.initialInvestment),
                profitShare: Math.max(0, profitShare),
                totalPaid,
                balance: Math.max(0, balance),
                roi: parseFloat(roi.toFixed(1)),
                dividendCount: sh.dividends.length,
            };
        });

        // 5. All-time totals
        const allSales = await (prisma as any).sale.aggregate({
            where: { companyId, status: 'Completed' },
            _sum: { total: true },
        });
        const allDividends = await (prisma as any).shopDividend.aggregate({
            where: { companyId, status: 'Paid' },
            _sum: { amount: true },
        });

        return NextResponse.json({
            period: { from, to },
            totalRevenue,
            totalCOGS,
            totalProfit,
            allTimeRevenue: Number(allSales._sum.total || 0),
            allTimeDividendsPaid: Number(allDividends._sum.amount || 0),
            shareholders: shareholderData,
        });
    } catch (error) {
        console.error('GET /api/shop/shareholders/analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
