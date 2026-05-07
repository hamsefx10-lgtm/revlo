import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';

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
        const limit = parseInt(searchParams.get('limit') || '10');

        const dateFrom = startOfDay(subDays(new Date(), 30));

        // Group sales by customerId
        const topCustomersData = await prisma.sale.groupBy({
            by: ['customerId'],
            where: {
                companyId: currentUser.companyId,
                customerId: { not: null },
                createdAt: { gte: dateFrom },
                status: { not: 'Cancelled' } 
            },
            _sum: { total: true },
            _count: { id: true },
            orderBy: { _sum: { total: 'desc' } },
            take: limit
        });

        const topCustomerIds = topCustomersData.map(t => t.customerId).filter(Boolean) as string[];

        // Fetch names and details from ShopClient
        const topCustomersDetails = topCustomerIds.length > 0 ? await prisma.shopClient.findMany({
            where: { id: { in: topCustomerIds } },
            select: { id: true, name: true, phone: true }
        }) : [];

        const formattedTopCustomers = topCustomersData.map(t => {
            const detail = topCustomersDetails.find(c => c.id === t.customerId);
            return {
                id: t.customerId,
                name: detail?.name || 'Walk-in / Unknown',
                phone: detail?.phone || 'N/A',
                orders: t._count.id,
                revenue: Number(t._sum.total || 0)
            };
        });

        return NextResponse.json({ topCustomers: formattedTopCustomers });

    } catch (error) {
        console.error('Error fetching top customers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
