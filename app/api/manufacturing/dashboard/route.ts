import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/dashboard
export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();

        // Production Stats
        const totalOrders = await prisma.productionOrder.count({ where: { companyId } });
        const activeOrders = await prisma.productionOrder.count({
            where: {
                companyId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            }
        });

        // Inventory Stats
        const allInventory = await prisma.inventoryItem.findMany({
            where: { companyId },
            select: { inStock: true, minStock: true }
        });
        const lowStockCount = allInventory.filter(i => i.inStock <= i.minStock).length;

        // Recent Orders
        const recentOrders = await prisma.productionOrder.findMany({
            where: { companyId },
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: { select: { name: true } } }
        });

        // Work Orders by Stage (Kanban)
        const activeWorkOrders = await prisma.workOrder.findMany({
            where: {
                companyId,
                status: { notIn: ['COMPLETED', 'CANCELLED'] }
            },
            include: {
                productionOrder: { select: { productName: true, orderNumber: true, priority: true } }
            }
        });

        return NextResponse.json({
            totalOrders,
            activeOrders,
            lowStockCount,
            recentOrders,
            activeWorkOrders
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ message: 'Error fetching stats' }, { status: 500 });
    }
}
