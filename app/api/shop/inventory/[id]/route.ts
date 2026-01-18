import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/inventory/[id] - Get single product details
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

        const product = await prisma.product.findUnique({
            where: { id },
            include: { supplier: true }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Fetch recent stock movements for history
        const stockHistory = await prisma.stockMovement.findMany({
            where: { productId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        return NextResponse.json({
            product,
            history: stockHistory
        });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/shop/inventory/[id] - Delete product
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

        // Check if product exists and belongs to user
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Delete related stock movements first (or handle via cascade if configured)
        // Ideally we should soft-delete or prevent deletion if there are sales
        const salesCount = await prisma.saleItem.count({
            where: { productId: id },
        });

        if (salesCount > 0) {
            return NextResponse.json({ error: 'Cannot delete product with existing sales history' }, { status: 400 });
        }

        await prisma.stockMovement.deleteMany({
            where: { productId: id },
        });

        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/shop/inventory/[id] - Update product
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
        const { name, sku, category, costPrice, sellingPrice, stock, minStock, description, supplierId } = body;

        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        if (product.userId !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Calculate new status
        const newStatus = (parseInt(stock) > parseInt(minStock)) ? 'In Stock' : (parseInt(stock) > 0) ? 'Low Stock' : 'Out of Stock';

        // Check stock change to record movement if needed (simplified)
        // For accurate stock tracking, adjustments should use a specific endpoint, but editing is allowed here too.

        const updatedProduct = await prisma.product.update({
            where: { id },
            data: {
                name,
                sku,
                category,
                costPrice: parseFloat(costPrice),
                sellingPrice: parseFloat(sellingPrice),
                stock: parseInt(stock),
                minStock: parseInt(minStock),
                description,
                status: newStatus,
                supplierId: supplierId || null,
            },
        });

        return NextResponse.json({ product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
