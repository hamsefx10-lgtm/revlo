import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, subDays, format } from 'date-fns';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Total Revenue & Orders
        const salesAggregate = await prisma.sale.aggregate({
            where: { userId },
            _sum: { total: true },
            _count: { id: true },
        });

        // 2. Active Products & Stock
        const productsCount = await prisma.product.count({
            where: { userId },
        });

        const lowStockCount = await prisma.product.count({
            where: {
                userId,
                status: 'Low Stock'
            },
        });

        // 3. Low Stock Items (Top 5)
        const lowStockItems = await prisma.product.findMany({
            where: {
                userId,
                stock: { lte: 10 } // Assuming 10 is generic threshold, or use status
            },
            take: 5,
            orderBy: { stock: 'asc' },
            select: { id: true, name: true, stock: true }
        });

        // 4. Sales Chart Data (Last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
                date: d,
                name: format(d, 'EEE'), // Mon, Tue...
                sales: 0
            };
        });

        const startDate = startOfDay(subDays(new Date(), 6));

        const recentSales = await prisma.sale.findMany({
            where: {
                userId,
                createdAt: { gte: startDate }
            },
            select: {
                createdAt: true,
                total: true
            }
        });

        // Aggregate sales by day
        recentSales.forEach(sale => {
            const dayName = format(sale.createdAt, 'EEE');
            const day = last7Days.find(d => d.name === dayName);
            if (day) {
                day.sales += sale.total;
            }
        });

        // 5. Unpaid Purchase Orders (Pending)
        const unpaidOrders = await prisma.purchaseOrder.findMany({
            where: {
                userId,
                paymentStatus: { not: 'Paid' }
            },
            include: {
                vendor: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            metrics: {
                revenue: salesAggregate._sum.total || 0,
                orders: salesAggregate._count.id || 0,
                products: productsCount,
                lowStock: lowStockCount
            },
            chartData: last7Days,
            lowStockItems,
            unpaidOrders
        });

    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
