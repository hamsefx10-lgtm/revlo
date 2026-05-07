import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const CREDIT_PACKAGES = [
        { id: 'starter', name: 'Starter', credits: 150, priceETB: 1000, priceUSD: 8.33, popular: false },
        { id: 'business', name: 'Business', credits: 500, priceETB: 2500, priceUSD: 20.83, popular: true },
        { id: 'enterprise', name: 'Enterprise', credits: 2000, priceETB: 7500, priceUSD: 62.50, popular: false },
    ];

    const defaultResponse = { credits: 10, used: 0, plan: 'FREE_TRIAL', packages: CREDIT_PACKAGES, stats: { totalScans: 0, successfulScans: 0, successRate: 0 }, recentScans: [] };

    try {
        const { getServerSession } = require('next-auth/next');
        const { authOptions } = require('@/lib/auth');
        const prisma = require('@/lib/prisma').default;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = (session as any).user.companyId;
        if (!companyId) {
            return NextResponse.json(defaultResponse);
        }

        let credits = 10, used = 0, plan = 'FREE_TRIAL';
        try {
            const result: any[] = await prisma.$queryRawUnsafe(
                `SELECT "scanCredits", "scanCreditsUsed", "scanPlan" FROM "companies" WHERE "_id" = $1`,
                companyId
            );
            if (result?.[0]) {
                credits = result[0].scanCredits ?? 10;
                used = result[0].scanCreditsUsed ?? 0;
                plan = result[0].scanPlan || 'FREE_TRIAL';
            }
        } catch (e: any) {
            console.log('[Credits GET] DB error:', e?.message?.substring(0, 100));
        }

        return NextResponse.json({
            credits, used, plan,
            packages: CREDIT_PACKAGES,
            stats: { totalScans: 0, successfulScans: 0, successRate: 0 },
            recentScans: [],
        });

    } catch (error: any) {
        console.error('[Credits GET] Error:', error?.message);
        return NextResponse.json(defaultResponse);
    }
}

export async function POST(req: NextRequest) {
    try {
        const { getServerSession } = require('next-auth/next');
        const { authOptions } = require('@/lib/auth');
        const prisma = require('@/lib/prisma').default;

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = (session as any).user.companyId;
        const role = (session as any).user.role;
        if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });
        if (role !== 'ADMIN' && role !== 'OWNER') return NextResponse.json({ error: 'Admin required' }, { status: 403 });

        const body = await req.json();
        const { action, packageId, amount, targetCompanyId } = body;
        const targetId = targetCompanyId || companyId;

        const CREDIT_PACKAGES = [
            { id: 'starter', name: 'Starter', credits: 150, priceETB: 1000 },
            { id: 'business', name: 'Business', credits: 500, priceETB: 2500 },
            { id: 'enterprise', name: 'Enterprise', credits: 2000, priceETB: 7500 },
        ];

        if (action === 'add_package' && packageId) {
            const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
            if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
            await prisma.$queryRawUnsafe(`UPDATE "companies" SET "scanCredits" = "scanCredits" + $1, "scanPlan" = $2 WHERE "_id" = $3`, pkg.credits, pkg.id.toUpperCase(), targetId);
            const r: any[] = await prisma.$queryRawUnsafe(`SELECT "scanCredits", "scanPlan" FROM "companies" WHERE "_id" = $1`, targetId);
            return NextResponse.json({ success: true, credits: r?.[0]?.scanCredits, plan: r?.[0]?.scanPlan });
        } else if (action === 'add_manual' && amount) {
            const n = parseInt(amount);
            if (isNaN(n) || n <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
            await prisma.$queryRawUnsafe(`UPDATE "companies" SET "scanCredits" = "scanCredits" + $1, "scanPlan" = 'ACTIVE' WHERE "_id" = $2`, n, targetId);
            const r: any[] = await prisma.$queryRawUnsafe(`SELECT "scanCredits", "scanPlan" FROM "companies" WHERE "_id" = $1`, targetId);
            return NextResponse.json({ success: true, credits: r?.[0]?.scanCredits, plan: r?.[0]?.scanPlan });
        }
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('[Credits POST] Error:', error?.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
