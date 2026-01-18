import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/purchases - List POs
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'All';

        const where: any = {
            userId: session.user.id
        };

        if (status !== 'All') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { poNumber: { contains: search, mode: 'insensitive' } },
                { vendor: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const purchases = await prisma.purchaseOrder.findMany({
            where,
            include: {
                vendor: true,
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ purchases });
    } catch (error) {
        console.error('Error fetching purchases:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/purchases - Create PO
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { vendorId, items, notes, expectedDelivery, paidAmount, paymentMethod } = body;

        if (!vendorId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Vendor and items are required' }, { status: 400 });
        }

        // Get User Company
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User company not found' }, { status: 400 });
        }

        // Generate PO Number (PO-{Year}-{Sequence})
        const count = await prisma.purchaseOrder.count({ where: { userId: session.user.id } });
        const poNumber = `PO-${new Date().getFullYear()}-${(count + 1).toString().padStart(3, '0')}`;

        // Calculate totals
        let subtotal = 0;
        items.forEach((item: any) => {
            subtotal += item.quantity * item.unitCost;
        });
        const tax = 0;
        const total = subtotal + tax;

        // Determine Payment Status
        const paid = parseFloat(paidAmount || 0);
        let paymentStatus = 'Unpaid';
        if (paid >= total) paymentStatus = 'Paid';
        else if (paid > 0) paymentStatus = 'Partial';

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create PO
            const purchaseOrder = await tx.purchaseOrder.create({
                data: {
                    poNumber,
                    vendorId,
                    userId: session.user.id,
                    status: 'Pending',
                    subtotal,
                    tax,
                    total,
                    paidAmount: paid,
                    paymentStatus,
                    notes,
                    expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
                }
            });

            // Create Items
            for (const item of items) {
                await tx.purchaseOrderItem.create({
                    data: {
                        poId: purchaseOrder.id,
                        productId: item.productId,
                        productName: item.productName,
                        quantity: parseInt(item.quantity),
                        unitCost: parseFloat(item.unitCost),
                        total: parseInt(item.quantity) * parseFloat(item.unitCost)
                    }
                });
            }

            // Create Expense (Payment)
            if (paid > 0) {
                await tx.expense.create({
                    data: {
                        description: `Payment for Purchase Order ${poNumber}`,
                        amount: paid,
                        paidFrom: paymentMethod || 'Check',
                        category: 'Inventory Purchase',
                        vendorId: vendorId,
                        expenseDate: new Date(),
                        companyId: user.companyId,
                        userId: session.user.id,
                        purchaseOrderId: purchaseOrder.id,
                        approved: true
                    }
                });
            }

            return purchaseOrder;
        });

        return NextResponse.json({ purchaseOrder: result }, { status: 201 });

    } catch (error) {
        console.error('Error creating purchase order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
