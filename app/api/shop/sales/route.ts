import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage
let sales: any[] = [];
let products: any[] = [];

// POST /api/shop/sales
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { customerId, items, paymentMethod, notes } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in sale' }, { status: 400 });
        }

        let subtotal = 0;
        const saleItems = [];

        for (const item of items) {
            const product = products.find(p => p.id === item.productId);

            if (!product) {
                return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 });
            }

            if (product.stock < item.quantity) {
                return NextResponse.json({ error: `Insufficient stock for ${product.name}` }, { status: 400 });
            }

            const itemTotal = product.sellingPrice * item.quantity;
            subtotal += itemTotal;

            saleItems.push({
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.sellingPrice,
                total: itemTotal
            });

            // Update product stock
            product.stock -= item.quantity;
            product.status = product.stock > product.minStock ? 'In Stock' :
                product.stock > 0 ? 'Low Stock' : 'Out of Stock';
        }

        const tax = subtotal * 0.15;
        const total = subtotal + tax;
        const invoiceNumber = `INV-${Date.now()}`;

        const sale = {
            id: `sale_${Date.now()}`,
            invoiceNumber,
            customerId: customerId || null,
            subtotal,
            tax,
            total,
            paymentMethod: paymentMethod || 'Cash',
            status: 'Completed',
            notes: notes || null,
            items: saleItems,
            createdAt: new Date().toISOString()
        };

        sales.push(sale);

        return NextResponse.json({ sale }, { status: 201 });
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/shop/sales
export async function GET(req: NextRequest) {
    try {
        return NextResponse.json({ sales });
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
