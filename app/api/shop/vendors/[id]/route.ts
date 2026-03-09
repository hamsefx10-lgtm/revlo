import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/vendors/[id]
export async function GET(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = context.params;

        const vendor = await prisma.shopVendor.findUnique({
            where: { id },
            include: {
                purchaseOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!vendor) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        // Stats & Balances
        const allPOs = await prisma.purchaseOrder.findMany({
            where: { vendorId: id },
            select: { total: true, paidAmount: true, currency: true }
        });

        let totalSpentETB = 0;
        let balanceETB = 0;
        let totalSpentUSD = 0;
        let balanceUSD = 0;
        let totalOrders = allPOs.length;

        allPOs.forEach(po => {
            if (po.currency === 'USD') {
                totalSpentUSD += po.total;
                balanceUSD += (po.total - po.paidAmount);
            } else {
                totalSpentETB += po.total;
                balanceETB += (po.total - po.paidAmount);
            }
        });

        return NextResponse.json({
            vendor: {
                ...vendor,
                purchaseOrders: undefined
            },
            history: vendor.purchaseOrders,
            stats: {
                totalSpentETB,
                balanceETB,
                totalSpentUSD,
                balanceUSD,
                totalOrders
            }
        });

    } catch (error) {
        console.error('Error fetching vendor:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/shop/vendors/[id]
export async function PUT(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = context.params;
        const body = await req.json();
        const { companyName, contactPerson, email, phone, address } = body;

        const vendor = await prisma.shopVendor.update({
            where: { id },
            data: {
                name: companyName,
                contactPerson,
                email,
                phoneNumber: phone,
                address
            }
        });

        return NextResponse.json({ vendor });

    } catch (error) {
        console.error('Error updating vendor:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/shop/vendors/[id]
export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = context.params;

        // Check dependencies (PO)
        const poCount = await prisma.purchaseOrder.count({
            where: { vendorId: id }
        });

        if (poCount > 0) {
            return NextResponse.json({ error: 'Cannot delete vendor with existing purchase orders.' }, { status: 400 });
        }

        await prisma.shopVendor.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Vendor deleted successfully' });

    } catch (error) {
        console.error('Error deleting vendor:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
