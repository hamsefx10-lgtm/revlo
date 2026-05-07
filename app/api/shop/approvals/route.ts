import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET all approval requests for the company
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true, role: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        // Only admins or managers can see all approval requests
        // A regular member might only see their own requests (optional logic)
        const whereClause: any = { companyId: user.companyId };
        
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
            // Regular user sees only their own requests
            whereClause.requestedById = session.user.id;
        }

        const approvals = await prisma.approvalRequest.findMany({
            where: whereClause,
            include: {
                requestedBy: { select: { fullName: true, email: true, role: true } },
                approvedBy: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ approvals });
    } catch (error) {
        console.error('Error fetching approvals:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
