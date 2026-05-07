import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID;
        
        if (session?.user?.id !== SUPER_ADMIN_ID) {
            return NextResponse.json({ error: 'Unauthorized. Super Admin access only.' }, { status: 403 });
        }

        // --- FETCH STATS ---
        const [totalCompanies, totalUsers, pendingRequests, allApprovedRequests] = await Promise.all([
            prisma.company.count(),
            prisma.user.count(),
            prisma.approvalRequest.count({ where: { type: 'BUY_CREDITS', status: 'PENDING' } }),
            prisma.approvalRequest.findMany({ 
                where: { type: 'BUY_CREDITS', status: 'APPROVED' },
                select: { requestData: true }
            })
        ]);

        // Calculate Total Revenue from Approved Requests
        const totalRevenue = allApprovedRequests.reduce((sum, req: any) => {
            const amount = req.requestData.amount || 0;
            return sum + Number(amount);
        }, 0);

        // Fetch Recent Requests
        const recentRequests = await prisma.approvalRequest.findMany({
            where: { type: 'BUY_CREDITS' },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                company: {
                    select: { name: true }
                },
                requestedBy: {
                    select: { fullName: true }
                }
            }
        });

        return NextResponse.json({
            stats: {
                totalCompanies,
                totalUsers,
                pendingRequests,
                totalRevenue
            },
            recentRequests
        });
    } catch (error: any) {
        console.error('[Admin Stats GET] Error:', error?.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
