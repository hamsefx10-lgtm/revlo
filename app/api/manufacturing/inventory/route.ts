import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/inventory
export async function GET(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';

        const where: any = {
            companyId,
            userId, // Strict filtering by User
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (category && category !== 'All Categories') {
            where.category = category;
        }

        const items = await prisma.inventoryItem.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ items });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ message: 'Error fetching inventory' }, { status: 500 });
    }
}

// POST /api/manufacturing/inventory
export async function POST(request: Request) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const body = await request.json();

        const item = await prisma.inventoryItem.create({
            data: {
                companyId,
                userId, // Owner
                name: body.name,
                sku: body.sku,
                category: body.category,
                description: body.description,
                unit: body.unit,
                inStock: parseFloat(body.inStock) || 0,
                minStock: parseFloat(body.minStock) || 0,
                purchasePrice: parseFloat(body.purchasePrice) || 0,
                sellingPrice: parseFloat(body.sellingPrice) || 0,
                location: body.location,
                supplier: body.supplier
            }
        });

        return NextResponse.json({ item, message: 'Item added successfully' });
    } catch (error: any) {
        console.error('Error creating inventory item (FULL):', JSON.stringify(error, null, 2));
        console.error('Error Object:', error);
        return NextResponse.json({ message: 'Error creating item', details: error.message }, { status: 500 });
    }
}
