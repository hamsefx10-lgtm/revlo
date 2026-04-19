import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/shareholders/dividends
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const dividends = await (prisma as any).shopDividend.findMany({
            where: { companyId: user.companyId },
            include: {
                shareholder: { select: { id: true, name: true, sharePercentage: true } },
                account: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ dividends });
    } catch (error) {
        console.error('GET /api/shop/shareholders/dividends error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/shareholders/dividends — Create a new dividend payment
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const body = await req.json();
        const { shareholderId, amount, profitAmount, periodStart, periodEnd, accountId, note, status } = body;

        if (!shareholderId || !amount || !periodStart || !periodEnd) {
            return NextResponse.json({ error: 'shareholderId, amount, periodStart, periodEnd required' }, { status: 400 });
        }

        const companyId = user.companyId;

        // Validate shareholder belongs to company
        const sh = await (prisma as any).shopShareholder.findFirst({ where: { id: shareholderId, companyId } });
        if (!sh) return NextResponse.json({ error: 'Shareholder not found' }, { status: 404 });

        const isPaid = (status === 'Paid') || false;

        const dividend = await (prisma as any).shopDividend.create({
            data: {
                shareholderId,
                amount: parseFloat(amount),
                profitAmount: parseFloat(profitAmount || amount),
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                paidDate: isPaid ? new Date() : null,
                status: isPaid ? 'Paid' : 'Pending',
                accountId: accountId || null,
                note: note || null,
                companyId,
            },
            include: {
                shareholder: { select: { name: true } },
                account: { select: { name: true } },
            },
        });

        // Update totalReceived on shareholder if paid
        if (isPaid) {
            await (prisma as any).shopShareholder.update({
                where: { id: shareholderId },
                data: { totalReceived: { increment: parseFloat(amount) } },
            });
        }

        return NextResponse.json({ dividend }, { status: 201 });
    } catch (error) {
        console.error('POST /api/shop/shareholders/dividends error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
