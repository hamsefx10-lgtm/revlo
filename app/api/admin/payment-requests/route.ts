import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID;
        if (session?.user?.id !== SUPER_ADMIN_ID) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const requests = await prisma.approvalRequest.findMany({
            where: { type: 'BUY_CREDITS' },
            orderBy: { createdAt: 'desc' },
            include: {
                company: {
                    select: { name: true }
                },
                requestedBy: {
                    select: { fullName: true }
                }
            }
        });

        return NextResponse.json({ requests });
    } catch (error: any) {
        console.error('[Admin Payments GET] Error:', error?.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
