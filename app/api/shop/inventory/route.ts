import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/inventory - List all products

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's company ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User setup incomplete: No Company ID' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status') || 'All';

        const where: any = {
            companyId: user.companyId,
        };

        if (status !== 'All') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/inventory - Add new product
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user's company ID
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'User setup incomplete: No Company ID' }, { status: 400 });
        }

        const body = await req.json();
        const { name, sku, category, costPrice, sellingPrice, stock, minStock, description } = body;

        // Basic validation
        if (!name || !sku || !sellingPrice) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check for duplicate SKU within company
        const existingProduct = await prisma.product.findFirst({
            where: {
                sku,
                companyId: user.companyId
            },
        });

        if (existingProduct) {
            return NextResponse.json({ error: 'Product with this SKU already exists in your company' }, { status: 400 });
        }

        // Determine status
        const status = stock > minStock ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock';

        const product = await prisma.product.create({
            data: {
                name,
                sku,
                category: category || 'General',
                costPrice: parseFloat(costPrice) || 0,
                sellingPrice: parseFloat(sellingPrice),
                stock: parseInt(stock) || 0,
                minStock: parseInt(minStock) || 5,
                description,
                status,
                userId: session.user.id,
                companyId: user.companyId,
                supplierId: body.supplierId || null,
            },
        });

        // Track initial stock movement


        if (stock > 0) {
            await prisma.stockMovement.create({
                data: {
                    productId: product.id,
                    type: 'Adjustment', // Initial stock
                    quantity: parseInt(stock),
                    userId: session.user.id,
                    companyId: user.companyId,
                    reference: 'Initial stock',
                },
            });
        }

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
