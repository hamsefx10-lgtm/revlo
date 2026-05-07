import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/company - Get Company Info

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { company: true }
        });

        if (!user?.company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Also fetch scan credits via raw SQL
        let scanCredits = 10, scanCreditsUsed = 0, scanPlan = 'FREE_TRIAL';
        try {
            const cr: any[] = await prisma.$queryRawUnsafe(
                `SELECT "scanCredits", "scanCreditsUsed", "scanPlan" FROM "companies" WHERE "_id" = $1`,
                user.company.id
            );
            if (cr?.[0]) {
                scanCredits = cr[0].scanCredits ?? 10;
                scanCreditsUsed = cr[0].scanCreditsUsed ?? 0;
                scanPlan = cr[0].scanPlan || 'FREE_TRIAL';
            }
        } catch { }

        return NextResponse.json({
            company: user.company,
            scanCredits,
            scanCreditsUsed,
            scanPlan,
        });
    } catch (error) {
        console.error('Error fetching company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/shop/company - Update Company Info


export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            name, phone, address, email, website, currency,
            taxId, taxRate, receiptHeader, receiptFooter, requireReceiptNumber
        } = body;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const company = await prisma.company.update({
            where: { id: user.companyId },
            data: {
                name,
                phone,
                address,
                email,
                website,
                taxId,
                taxRate: taxRate ? parseFloat(taxRate) : undefined,
                receiptHeader,
                receiptFooter,
                ...(requireReceiptNumber !== undefined && { requireReceiptNumber: Boolean(requireReceiptNumber) })
            }
        });

        return NextResponse.json({ company });

    } catch (error) {
        console.error('Error updating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
