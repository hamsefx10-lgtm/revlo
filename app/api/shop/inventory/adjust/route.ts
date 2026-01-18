import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { productId, quantity, type, notes } = body;

        // Validation
        if (!productId || quantity === undefined || quantity === null || quantity === 0) {
            return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            const product = await tx.product.findUnique({ where: { id: productId } });
            if (!product) throw new Error("Product not found");

            const newStock = product.stock + quantity;
            if (newStock < 0) throw new Error("Resulting stock cannot be negative");

            // Update Product
            await tx.product.update({
                where: { id: productId },
                data: {
                    stock: newStock,
                    status: newStock > product.minStock ? 'In Stock' : newStock > 0 ? 'Low Stock' : 'Out of Stock'
                }
            });

            // Record Movement
            await tx.stockMovement.create({
                data: {
                    productId,
                    type: type || 'Adjustment', // e.g. Damage, Loss, Correction, Expired
                    quantity: quantity,
                    reference: notes || 'Manual Adjustment',
                    userId: session.user.id
                }
            });

            return newStock;
        });

        return NextResponse.json({ success: true, newStock: result });

    } catch (error: any) {
        console.error("Adjustment error:", error);
        return NextResponse.json({ error: error.message || 'Adjustment failed' }, { status: 500 });
    }
}
