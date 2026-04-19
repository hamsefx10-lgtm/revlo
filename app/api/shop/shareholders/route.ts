import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/shop/shareholders
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const shareholders = await (prisma as any).shopShareholder.findMany({
            where: { companyId: user.companyId },
            include: {
                dividends: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute totalPaid and outstanding for each
        const enriched = shareholders.map((sh: any) => {
            const totalPaid = sh.dividends
                .filter((d: any) => d.status === 'Paid')
                .reduce((s: number, d: any) => s + Number(d.amount), 0);
            return { ...sh, totalPaid };
        });

        return NextResponse.json({ shareholders: enriched });
    } catch (error) {
        console.error('GET /api/shop/shareholders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/shareholders
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { companyId: true } });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const body = await req.json();
        const { name, email, phone, sharePercentage, initialInvestment, joinedDate, notes } = body;

        if (!name || !email || !sharePercentage || !joinedDate) {
            return NextResponse.json({ error: 'name, email, sharePercentage and joinedDate are required' }, { status: 400 });
        }

        // Validate total shares won't exceed 100%
        const existing = await (prisma as any).shopShareholder.aggregate({
            where: { companyId: user.companyId, status: 'Active' },
            _sum: { sharePercentage: true },
        });
        const currentTotal = existing._sum.sharePercentage || 0;
        if (currentTotal + parseFloat(sharePercentage) > 100) {
            return NextResponse.json({ error: `Total shares exceed 100%. Available: ${(100 - currentTotal).toFixed(1)}%` }, { status: 400 });
        }

        const shareholder = await (prisma as any).shopShareholder.create({
            data: {
                name,
                email,
                phone: phone || null,
                sharePercentage: parseFloat(sharePercentage),
                initialInvestment: initialInvestment ? parseFloat(initialInvestment) : 0,
                joinedDate: new Date(joinedDate),
                notes: notes || null,
                companyId: user.companyId,
            },
        });

        return NextResponse.json({ shareholder }, { status: 201 });
    } catch (error) {
        console.error('POST /api/shop/shareholders error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
