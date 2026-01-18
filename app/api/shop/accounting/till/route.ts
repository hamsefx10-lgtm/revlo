import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        // Get Active Session
        const activeSession = await prisma.tillSession.findFirst({
            where: {
                companyId: user.companyId,
                status: 'OPEN'
            },
            include: { user: { select: { fullName: true } } }
        });

        // Get Recent History
        const history = await prisma.tillSession.findMany({
            where: {
                companyId: user.companyId,
                status: 'CLOSED'
            },
            include: { user: { select: { fullName: true } } },
            orderBy: { openingTime: 'desc' },
            take: 5
        });

        return NextResponse.json({ activeSession, history });
    } catch (error) {
        console.error('Error fetching till data:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const body = await req.json();
        const { action, amount, notes } = body;

        // Open Session
        if (action === 'OPEN') {
            // Check if already open
            const existing = await prisma.tillSession.findFirst({
                where: { companyId: user.companyId, status: 'OPEN' }
            });
            if (existing) return NextResponse.json({ error: 'A till session is already open' }, { status: 400 });

            const newSession = await prisma.tillSession.create({
                data: {
                    companyId: user.companyId,
                    userId: session.user.id,
                    openingFloat: Number(amount) || 0,
                    status: 'OPEN',
                    note: notes
                }
            });
            return NextResponse.json({ session: newSession });
        }

        // Close Session
        if (action === 'CLOSE') {
            const activeSession = await prisma.tillSession.findFirst({
                where: { companyId: user.companyId, status: 'OPEN' }
            });
            if (!activeSession) return NextResponse.json({ error: 'No open session' }, { status: 400 });

            // Calculate expected cash (This would actally need complex aggregation of Cash sales since opening)
            // For now, we update the closing cash provided by user
            const closingCash = Number(amount);
            const variance = closingCash - (activeSession.expectedCash || closingCash); // Placeholder logic

            const closedSession = await prisma.tillSession.update({
                where: { id: activeSession.id },
                data: {
                    closingTime: new Date(),
                    closingCash: closingCash,
                    status: 'CLOSED',
                    variance: 0 // Need real sale aggregation for this
                }
            });
            return NextResponse.json({ session: closedSession });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
