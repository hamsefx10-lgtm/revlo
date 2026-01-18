import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/company - Get Company Info
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

        return NextResponse.json({ company: user.company });
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
            taxId, taxRate, receiptHeader, receiptFooter
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
                receiptFooter
            }
        });

        return NextResponse.json({ company });

    } catch (error) {
        console.error('Error updating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
