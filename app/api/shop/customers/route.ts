import { NextRequest, NextResponse } from 'next/server';

// Temporary in-memory storage
let customers: any[] = [];

// GET /api/shop/customers
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        let filtered = customers;

        if (search) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(search.toLowerCase()) ||
                c.phone.includes(search) ||
                (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
            );
        }

        return NextResponse.json({ customers: filtered });
    } catch (error) {
        console.error('Error fetching customers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/shop/customers
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, phone, address, status } = body;

        if (!name || !phone) {
            return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
        }

        const customer = {
            id: `cust_${Date.now()}`,
            name,
            email: email || null,
            phone,
            address: address || null,
            status: status || 'Active',
            totalOrders: 0,
            totalSpent: 0,
            lastOrder: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        customers.push(customer);

        return NextResponse.json({ customer }, { status: 201 });
    } catch (error) {
        console.error('Error creating customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
