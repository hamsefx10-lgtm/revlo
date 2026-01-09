import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage
let products: any[] = [];

// GET /api/shop/inventory/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const product = products.find(p => p.id === params.id);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/shop/inventory/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const index = products.findIndex(p => p.id === params.id);

        if (index === -1) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        products[index] = {
            ...products[index],
            ...body,
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json({ product: products[index] });
    } catch (error) {
        console.error('Error updating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/shop/inventory/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const index = products.findIndex(p => p.id === params.id);

        if (index === -1) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        products.splice(index, 1);

        return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
