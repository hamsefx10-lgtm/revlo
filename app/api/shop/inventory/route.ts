import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage (replace with database later)
let products: any[] = [];

// GET /api/shop/inventory - List all products
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const status = searchParams.get('status');

        let filtered = products;

        if (search) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (status && status !== 'All') {
            filtered = filtered.filter(p => p.status === status);
        }

        return NextResponse.json({ products: filtered });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/inventory - Create new product
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, category, description, costPrice, sellingPrice, stock, minStock } = body;

        if (!name || !costPrice || !sellingPrice || stock === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const product = {
            id: `prod_${Date.now()}`,
            name,
            sku: `SKU-${Date.now()}`,
            category: category || 'Uncategorized',
            description: description || '',
            costPrice: parseFloat(costPrice),
            sellingPrice: parseFloat(sellingPrice),
            stock: parseInt(stock),
            minStock: parseInt(minStock) || 5,
            status: parseInt(stock) > parseInt(minStock || 5) ? 'In Stock' :
                parseInt(stock) > 0 ? 'Low Stock' : 'Out of Stock',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        products.push(product);

        return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
        console.error('Error creating product:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
