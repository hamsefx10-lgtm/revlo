import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/vendors
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        // Fetch User's companyId to filter vendors by company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ vendors: [] });
        }

        const where: any = {
            companyId: user.companyId
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } }, // Schema uses 'name'
                { contactPerson: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const vendors = await prisma.shopVendor.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { purchaseOrders: { where: { status: 'Ordered' } } }
                }
            }
        });

        // Map 'name' to 'companyName' for frontend compatibility
        const formattedVendors = vendors.map(v => ({
            ...v,
            companyName: v.name,
            openOrders: v._count?.purchaseOrders || 0
        }));

        return NextResponse.json({ vendors: formattedVendors });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/vendors
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { companyName, contactPerson, email, phone, address, category } = body;

        if (!companyName) {
            return NextResponse.json({ error: 'Company Name is required' }, { status: 400 });
        }

        // Fetch companyId
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User does not belong to a company' }, { status: 400 });
        }

        // Schema uses 'name', 'type'. 'ShopVendor' model.
        const vendor = await prisma.shopVendor.create({
            data: {
                name: companyName, // Map to DB 'name'
                type: category || 'General', // Map category to 'type' (Required)
                contactPerson: contactPerson || '',
                email: email || '',
                phone: phone || '',
                address: address || '',
                productsServices: null,
                notes: '',
                userId: session.user.id,
                companyId: user.companyId
            }
        });

        // Return with companyName for frontend consistency
        return NextResponse.json({
            vendor: { ...vendor, companyName: vendor.name }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating vendor:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
