import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/vendors
export async function GET(request: Request) {
    try {
        const companyId = await getSessionCompanyId();
        const vendors = await prisma.shopVendor.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
            select: { id: true, name: true }
        });
        return NextResponse.json({ vendors });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching vendors' }, { status: 500 });
    }
}
