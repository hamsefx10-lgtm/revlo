import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// PATCH /api/shop/shareholders/dividends/[id] — Mark as Paid
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const body = await req.json();
        const { status, paidDate, accountId, note } = body;

        const existing = await (prisma as any).shopDividend.findFirst({
            where: { id: params.id, companyId: user.companyId },
        });
        if (!existing) return NextResponse.json({ error: 'Dividend not found' }, { status: 404 });

        const dividend = await (prisma as any).shopDividend.update({
            where: { id: params.id },
            data: {
                status: status || existing.status,
                paidDate: status === 'Paid' ? (paidDate ? new Date(paidDate) : new Date()) : existing.paidDate,
                ...(accountId && { accountId }),
                ...(note !== undefined && { note }),
            },
            include: {
                shareholder: { select: { id: true, name: true } },
                account: { select: { id: true, name: true } },
            },
        });

        // Update shareholder's totalReceived if newly marked Paid
        if (status === 'Paid' && existing.status !== 'Paid') {
            await (prisma as any).shopShareholder.update({
                where: { id: existing.shareholderId },
                data: { totalReceived: { increment: Number(existing.amount) } },
            });
        }

        return NextResponse.json({ dividend });
    } catch (error) {
        console.error('PATCH /api/shop/shareholders/dividends/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
