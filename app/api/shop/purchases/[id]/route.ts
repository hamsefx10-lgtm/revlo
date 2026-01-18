import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/purchases/[id] - Get PO Details
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
                items: true,
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
                            // Update cost price automatically?? Maybe weighted average?
                            // For simplicity, let's update cost price to latest
                            costPrice: item.unitCost
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
