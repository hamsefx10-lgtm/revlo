
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/purchase-orders - List Bills/POs
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const searchParams = req.nextUrl.searchParams;
        const status = searchParams.get('status');

        const where: any = { userId: session.user.id };
        if (status && status !== 'All') where.paymentStatus = status;

        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where,
            include: {
                vendor: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(purchaseOrders);

    } catch (error) {
        console.error('Error fetching POs:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/purchase-orders - Create Bill (PO)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { vendorId, items, notes, expectedDelivery, taxRate = 0 } = body;

        // Validation
        if (!vendorId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Vendor and items are required' }, { status: 400 });
        }

        // Calculate Totals
        let subtotal = 0;
        const validItems = items.map((item: any) => {
            const total = item.quantity * item.unitCost;
            subtotal += total;
            return {
                productId: item.productId,
                productName: item.productName || 'Unknown Item',
                quantity: parseInt(item.quantity),
                unitCost: parseFloat(item.unitCost),
                total
            };
        });

        const tax = subtotal * (taxRate / 100);
        const total = subtotal + tax;

        // Create PO
        const po = await prisma.purchaseOrder.create({
            data: {
                userId: session.user.id,
                vendorId,
                poNumber: `PO-${Date.now()}`, // Simple PO Number gen
                subtotal,
                tax,
                total,
                notes,
                expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
                status: 'Ordered',
                items: {
                    create: validItems
                }
            },
            include: {
                items: true
            }
        });

        return NextResponse.json(po, { status: 201 });

    } catch (error) {
        console.error('Error creating PO:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
