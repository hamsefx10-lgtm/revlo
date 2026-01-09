import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST /api/shop/purchases - Create purchase order
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { vendorId, items, expectedDelivery, notes } = body;

        if (!vendorId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Vendor and items are required' }, { status: 400 });
        }

        // Calculate totals
        let subtotal = 0;
        const poItems = [];

        for (const item of items) {
            const product = await prisma.product.findFirst({
                where: { id: item.productId, userId: session.user.id }
            });

            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
            }

            const itemTotal = item.unitCost * item.quantity;
            subtotal += itemTotal;

            poItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitCost: item.unitCost,
                total: itemTotal
            });
        }

        const tax = subtotal * 0.15;
        const total = subtotal + tax;

        // Generate PO number
        const poNumber = `PO-${Date.now()}`;

        const purchaseOrder = await prisma.purchaseOrder.create({
            data: {
                poNumber,
                vendorId,
                userId: session.user.id,
                subtotal,
                tax,
                total,
                status: 'Pending',
                expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
                notes: notes || null,
                items: {
                    create: poItems
                }
            },
            include: {
                items: true,
                vendor: true
            }
        });

        return NextResponse.json({ purchaseOrder }, { status: 201 });
    } catch (error) {
        console.error('Error creating purchase order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/shop/purchases - List purchase orders
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const where: any = {
            userId: session.user.id,
            ...(status && { status })
        };

        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                vendor: true,
                items: true
            }
        });

        return NextResponse.json({ purchaseOrders });
    } catch (error) {
        console.error('Error fetching purchase orders:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
