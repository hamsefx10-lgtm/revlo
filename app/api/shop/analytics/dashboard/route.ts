import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/analytics/dashboard - Get dashboard analytics
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const period = searchParams.get('period') || '7'; // days
        const daysAgo = parseInt(period);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysAgo);

        // Parallel queries for better performance
        const [
            totalRevenue,
            totalSales,
            totalProducts,
            lowStockProducts,
            recentSales,
            topProducts,
            salesByDay
        ] = await Promise.all([
            // Total Revenue
            prisma.sale.aggregate({
                where: {
                    userId: session.user.id,
                    createdAt: { gte: startDate }
                },
                _sum: { total: true }
            }),

            // Total Sales Count
            prisma.sale.count({
                where: {
                    userId: session.user.id,
                    createdAt: { gte: startDate }
                }
            }),

            // Total Products
            prisma.product.count({
                where: { userId: session.user.id }
            }),

            // Low Stock Products
            prisma.product.count({
                where: {
                    userId: session.user.id,
                    stock: { lte: prisma.product.fields.minStock }
                }
            }),

            // Recent Sales
            prisma.sale.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: 'desc' },
                take: 5,
                include: {
                    customer: true,
                    items: {
                        take: 3
                    }
                }
            }),

            // Top Selling Products
            prisma.saleItem.groupBy({
                by: ['productId'],
                where: {
                    sale: {
                        userId: session.user.id,
                        createdAt: { gte: startDate }
                    }
                },
                _sum: {
                    quantity: true,
                    total: true
                },
                orderBy: {
                    _sum: {
                        quantity: 'desc'
                    }
                },
                take: 5
            }),

            // Sales by day for chart
            prisma.$queryRaw`
                SELECT 
                    DATE("createdAt") as date,
                    COUNT(*) as count,
                    SUM(total) as revenue
                FROM "Sale"
                WHERE "userId" = ${session.user.id}
                AND "createdAt" >= ${startDate}
                GROUP BY DATE("createdAt")
                ORDER BY date ASC
            `
        ]);

        // Get product details for top products
        const topProductIds = topProducts.map(p => p.productId);
        const productDetails = await prisma.product.findMany({
            where: { id: { in: topProductIds } },
            select: { id: true, name: true, sellingPrice: true }
        });

        const topProductsWithDetails = topProducts.map(tp => {
            const product = productDetails.find(p => p.id === tp.productId);
            return {
                ...tp,
                product
            };
        });

        // Calculate previous period for comparison
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - daysAgo);

        const prevRevenue = await prisma.sale.aggregate({
            where: {
                userId: session.user.id,
                createdAt: { gte: prevStartDate, lt: startDate }
            },
            _sum: { total: true }
        });

        const revenueChange = prevRevenue._sum.total
            ? ((totalRevenue._sum.total || 0) - prevRevenue._sum.total) / prevRevenue._sum.total * 100
            : 0;

        return NextResponse.json({
            metrics: {
                totalRevenue: totalRevenue._sum.total || 0,
                totalSales,
                totalProducts,
                lowStockProducts,
                revenueChange: Math.round(revenueChange * 10) / 10
            },
            recentSales,
            topProducts: topProductsWithDetails,
            salesByDay
        });
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
