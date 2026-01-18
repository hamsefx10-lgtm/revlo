import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { products } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'No products provided' }, { status: 400 });
        }

        // Fetch user's company ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User setup incomplete: No Company ID' }, { status: 400 });
        }

        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        // Process sequentially to handle duplicates or create
        // Or use createMany if we don't care about duplicates (but sku might conflict)
        // For better error handling per item, loop is safer though slower for massive sets.
        // Given 'bulk' is typically 10-500 items, loop is fine.

        for (const item of products) {
            try {
                // Check if SKU exists
                const existing = await prisma.product.findUnique({
                    where: { sku: item.sku }
                });

                if (existing) {
                    // Update stock or ignore?
                    // Let's assume we Update Stock + Price if SKU matches
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            name: item.name,
                            stock: existing.stock + item.stock, // Add to existing stock
                            sellingPrice: item.sellingPrice,
                            costPrice: item.costPrice,
                            category: item.category,
                            minStock: item.minStock,
                            description: item.description
                        }
                    });
                    // Create Stock Movement log
                    if (item.stock > 0) {
                        await prisma.stockMovement.create({
                            data: {
                                productId: existing.id,
                                type: 'Adjustment',
                                quantity: item.stock,
                                userId: session.user.id,
                                reference: 'Bulk Import (Add)'
                            }
                        });
                    }
                } else {
                    // Create New
                    const newProduct = await prisma.product.create({
                        data: {
                            name: item.name,
                            sku: item.sku,
                            category: item.category,
                            sellingPrice: item.sellingPrice,
                            costPrice: item.costPrice,
                            stock: item.stock,
                            minStock: item.minStock,
                            description: item.description,
                            status: item.stock > item.minStock ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock',
                            userId: session.user.id
                        }
                    });

                    // Initial Stock Movement
                    await prisma.stockMovement.create({
                        data: {
                            productId: newProduct.id,
                            type: 'Initial',
                            quantity: item.stock,
                            userId: session.user.id,
                            reference: 'Bulk Import (Initial)'
                        }
                    });
                }
                successCount++;
            } catch (err: any) {
                console.error(`Failed to import ${item.name}:`, err);
                failedCount++;
                errors.push({ sku: item.sku, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            successCount,
            failedCount,
            errors
        });

    } catch (error: any) {
        console.error('Bulk Import Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
