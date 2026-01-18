import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '10');

        // Aggregate Sale Items
        // Note: Prisma groupBy doesn't support relation filtering easily in all DBs, but userId is on Sale, not SaleItem usually?
        // Let's check SaleItem model.
        // SaleItem has saleId. Sale has userId.
        // We need to filter by Sale.userId. This is hard with simple groupBy.
        // We might need to fetch Sales then Items, or use raw query.
        // Or findMany SaleItems where Sale.userId = ...

        // Easier: FindMany SaleItems with include Product, where Sale.userId = session.user.id
        // Then aggregate in JS (if data size allows). For Top 10 lists typically fine.

        // Better: Use groupBy on Sale table? No, we need Product.

        // Let's use Raw Query for performance if possible, OR just JS aggregation for MVP stability.
        // "Agent Mode" prefers stability.

        // Fetch all sale items for this user (could be heavy).
        // Let's date limit it? Last 30 days default?
        // Or Top All Time?

        // Let's do Last 30 Days Top Products.
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);

        const items = await prisma.saleItem.findMany({
            where: {
                sale: {
                    userId: session.user.id,
                    createdAt: { gte: dateFrom }
                }
            },
            select: {
                productId: true,
                productName: true,
                quantity: true,
                total: true
            }
        });

        const productMap = new Map<string, { id: string, name: string, sold: number, revenue: number }>();

        items.forEach(item => {
            const existing = productMap.get(item.productId) || {
                id: item.productId,
                name: item.productName,
                sold: 0,
                revenue: 0
            };
            existing.sold += item.quantity;
            existing.revenue += item.total;
            productMap.set(item.productId, existing);
        });

        const topProducts = Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);

        return NextResponse.json({ topProducts });

    } catch (error) {
        console.error('Error fetching top products:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
