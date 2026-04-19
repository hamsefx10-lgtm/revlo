import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/shareholders/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const shareholder = await (prisma as any).shopShareholder.findFirst({
            where: { id: params.id, companyId: user.companyId },
            include: {
                dividends: {
                    include: { account: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!shareholder) return NextResponse.json({ error: 'Shareholder not found' }, { status: 404 });

        return NextResponse.json({ shareholder });
    } catch (error) {
        console.error('GET /api/shop/shareholders/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/shop/shareholders/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const body = await req.json();
        const { name, email, phone, sharePercentage, initialInvestment, joinedDate, notes, status } = body;

        const shareholder = await (prisma as any).shopShareholder.updateMany({
            where: { id: params.id, companyId: user.companyId },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(phone !== undefined && { phone }),
                ...(sharePercentage && { sharePercentage: parseFloat(sharePercentage) }),
                ...(initialInvestment !== undefined && { initialInvestment: parseFloat(initialInvestment) }),
                ...(joinedDate && { joinedDate: new Date(joinedDate) }),
                ...(notes !== undefined && { notes }),
                ...(status && { status }),
            },
        });

        const updated = await (prisma as any).shopShareholder.findFirst({
            where: { id: params.id, companyId: user.companyId },
        });

        return NextResponse.json({ shareholder: updated });
    } catch (error) {
        console.error('PUT /api/shop/shareholders/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/shop/shareholders/[id] (soft delete — marks Inactive)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        await (prisma as any).shopShareholder.updateMany({
            where: { id: params.id, companyId: user.companyId },
            data: { status: 'Inactive' },
        });

        return NextResponse.json({ message: 'Shareholder deactivated' });
    } catch (error) {
        console.error('DELETE /api/shop/shareholders/[id] error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
