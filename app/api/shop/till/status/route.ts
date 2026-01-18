
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/till/status
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find open session for this user
        const activeSession = await prisma.tillSession.findFirst({
            where: {
                userId: session.user.id,
                status: 'OPEN'
            },
            include: {
                user: { select: { fullName: true } }
            }
        });

        if (!activeSession) {
            return NextResponse.json({ active: false });
        }

        // Calculate current accumulated cash sales
        const cashSales = await prisma.sale.aggregate({
            where: {
                userId: session.user.id,
                createdAt: { gte: activeSession.openingTime },
                paymentMethod: 'Cash'
            },
            _sum: { total: true }
        });

        return NextResponse.json({
            active: true,
            session: activeSession,
            currentCashSales: cashSales._sum.total || 0,
            expectedCashInDrawer: activeSession.openingFloat + (cashSales._sum.total || 0)
        });

    } catch (error) {
        console.error('Error checking till status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
