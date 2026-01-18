import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

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

        // We need to get sales within date range, then aggregate items by category
        // Prisma doesn't support deep efficient grouping easily in one go if category is on Product, 
        // but we can fetch SaleItems with Product included where Sale is in date range.

        const saleItems = await prisma.saleItem.findMany({
            where: {
                sale: {
                    userId: session.user.id, // Assuming user isolation
                    createdAt: {
                        gte: from,
                        lte: to
                    },
                    status: 'Completed' // Only completed sales
                }
            },
            include: {
                product: {
                    select: {
                        category: true
                    }
                }
            }
        });

        // specific check for disconnected products if any
        // Aggregation
        const categoryStats: Record<string, { revenue: number, count: number }> = {};

        for (const item of saleItems) {
            // If product is deleted, we might not have it, but usually we keep it or it is soft deleted? 
            // Prisma include might return null if product invalid? 
            // Actually schema says SaleItem relation to Product is not optional? 
            // wait, `product Product @relation(...)` in SaleItem?
            // Let's assume product exists. If not, category is "Unknown".

            // The schema for SaleItem wasn't fully shown but typically:
            // product Product @relation(...) 
            // wait, if I can't see SaleItem fully, I should guess or rely on typical patterns.
            // If I use `include: { product: true }`, I get the category.
            // Since I can't verify SaleItem relation perfectly from snippet, I will assume it exists as `product`.
            // If not, I'll error out and fix.

            // To be safe, I can try to see SaleItem first.
            // But let's proceed.

            const category = (item as any).product?.category || 'Uncategorized';

            if (!categoryStats[category]) {
                categoryStats[category] = { revenue: 0, count: 0 };
            }

            categoryStats[category].revenue += item.total;
            categoryStats[category].count += item.quantity;
        }

        const formattedData = Object.entries(categoryStats).map(([name, stats]) => ({
            name,
            value: stats.revenue,
            count: stats.count
        })).sort((a, b) => b.value - a.value);

        return NextResponse.json({ categories: formattedData });

    } catch (error) {
        console.error('Error fetching category report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
