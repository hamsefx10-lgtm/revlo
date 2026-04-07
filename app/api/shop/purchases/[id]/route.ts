import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/purchases/[id] - Get PO Details

export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                vendor: true,
                items: {
                    include: {
                        product: true
                    }
                },
                expenses: true
            }
        });

        if (!po) {
            return NextResponse.json({ error: 'PO not found' }, { status: 404 });
        }

        return NextResponse.json({ purchaseOrder: po });

    } catch (error) {
        console.error('Error fetching PO:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// DELETE /api/shop/purchases/[id] - Delete/Cancel PO
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        const po = await prisma.purchaseOrder.findUnique({
            where: { id }
        });

        if (!po) {
            return NextResponse.json({ error: 'PO not found' }, { status: 404 });
        }

        if (po.status === 'Received') {
            return NextResponse.json({ error: 'Cannot delete a received order. Please create a return instead.' }, { status: 400 });
        }

        await prisma.purchaseOrder.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting purchase order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/shop/purchases/[id] - Full Update PO
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const {
            vendorId,
            items,
            notes,
            expectedDelivery,
            currency,
            exchangeRate,
            shippingCost,
            customsFee,
            otherExpenses
        } = body;

        const existingPO = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!existingPO) {
            return NextResponse.json({ error: 'PO not found' }, { status: 404 });
        }

        if (existingPO.status === 'Received') {
            return NextResponse.json({ error: 'Cannot edit a received order. Please cancel or return it first.' }, { status: 400 });
        }

        // Calculate Totals
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitCost), 0);
        const total = subtotal + (shippingCost || 0) + (customsFee || 0) + (otherExpenses || 0);

        const updatedPO = await prisma.$transaction(async (tx) => {
            // 1. Delete existing items
            await tx.purchaseOrderItem.deleteMany({
                where: { poId: id }
            });

            // 2. Create new items
            const newItems = items.map((item: any) => ({
                poId: id,
                productId: item.productId,
                productName: item.productName,
                sku: item.sku || null,
                quantity: parseInt(item.quantity) || 0,
                unitCost: parseFloat(item.unitCost) || 0,
                unitCostUSD: parseFloat(item.unitCostUSD) || (currency === 'USD' ? parseFloat(item.unitCost) : null),
                sellingPrice: parseFloat(item.sellingPrice) || null,
                total: (parseInt(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)
            }));

            await tx.purchaseOrderItem.createMany({
                data: newItems
            });

            // 3. Update PO
            return await tx.purchaseOrder.update({
                where: { id },
                data: {
                    vendorId,
                    notes,
                    expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
                    currency,
                    exchangeRate,
                    shippingCost,
                    customsFee,
                    otherExpenses,
                    subtotal,
                    total,
                    // Re-calculate tax if needed, currently 0 in logic
                    tax: 0
                },
                include: {
                    vendor: true,
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            });
        });

        return NextResponse.json({ purchaseOrder: updatedPO });

    } catch (error) {
        console.error('Error updating purchase order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/shop/purchases/[id] - Update Status (e.g. Receive)
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!po) {
            return NextResponse.json({ error: 'PO not found' }, { status: 404 });
        }

        if (po.status === status) {
            return NextResponse.json({ purchaseOrder: po }); // No change
        }

        // Transaction for status update + stock movement
        const updatedPO = await prisma.$transaction(async (tx) => {

            // If marking as received, update stock
            if (status === 'Received' && po.status !== 'Received') {
                for (const item of po.items) {
                    // Update Product Stock
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { increment: item.quantity },
                            // Update cost price automatically (Weighted average or Latest)
                            // For now, update to latest as per current project pattern
                            costPrice: item.unitCost,
                            costPriceUSD: item.unitCostUSD || (po.currency === 'USD' ? item.unitCost : undefined),
                            ...(item.sellingPrice && { sellingPrice: item.sellingPrice })
                        }
                    });

                    // Create Stock Movement
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            type: 'Purchase',
                            quantity: item.quantity,
                            reference: po.poNumber,
                            userId: session.user.id
                        }
                    });
                }
            }

            // If un-receiving (e.g. back to Pending) - tough logic, maybe strictly forbid?
            // User requested: "Mark as Received". Reverse logic is complex. 
            // For now, allow receiving. If moving FROM Received TO Pending, we should ideally decrement stock.
            if (po.status === 'Received' && status !== 'Received') {
                for (const item of po.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    });

                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            type: 'Adjustment', // Negative adjustment
                            quantity: -item.quantity,
                            reference: po.poNumber,
                            userId: session.user.id
                        }
                    });
                }
            }

            // Update PO Status
            return await tx.purchaseOrder.update({
                where: { id },
                data: {
                    status,
                    // If received, perhaps set updated At


                }
            });
        });

        return NextResponse.json({ purchaseOrder: updatedPO });

    } catch (error) {
        console.error('Error updating purchase order:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
