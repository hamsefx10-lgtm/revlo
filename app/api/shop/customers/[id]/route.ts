import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage
let customers: any[] = [];

// GET /api/shop/customers/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const customer = customers.find(c => c.id === params.id);

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({
            customer,
            analytics: {
                totalSpent: customer.totalSpent || 0,
                totalOrders: customer.totalOrders || 0,
                avgOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0
            }
        });
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/shop/customers/[id]
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json();
        const index = customers.findIndex(c => c.id === params.id);

        if (index === -1) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        customers[index] = {
            ...customers[index],
            ...body,
            updatedAt: new Date().toISOString()
        };

        return NextResponse.json({ customer: customers[index] });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/shop/customers/[id]
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const index = customers.findIndex(c => c.id === params.id);

        if (index === -1) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        customers.splice(index, 1);

        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
