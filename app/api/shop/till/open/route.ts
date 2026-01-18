
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/till/open
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Check if already open
        const existing = await prisma.tillSession.findFirst({
            where: {
                userId: session.user.id,
                status: 'OPEN'
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'You already have an open till session.' }, { status: 400 });
        }

        const body = await req.json();
        const { openingFloat, note } = body;

        const sessionData = await prisma.tillSession.create({
            data: {
                userId: session.user.id,
                companyId: user.companyId,
                openingFloat: parseFloat(openingFloat) || 0,
                note,
                status: 'OPEN',
                openingTime: new Date()
            }
        });

        return NextResponse.json({ success: true, session: sessionData }, { status: 201 });

    } catch (error) {
        console.error('Error opening till:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
