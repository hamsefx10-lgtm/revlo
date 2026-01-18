import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireManufacturingAccess } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/customers/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const customer = await prisma.customer.findFirst({
            where: { id: params.id, companyId, userId },
            include: {
                productionOrders: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                },
                projects: {
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ message: 'Customer not found' }, { status: 404 });
        }

        return NextResponse.json({ customer });
    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json({ message: 'Error fetching customer' }, { status: 500 });
    }
}

// PUT /api/manufacturing/customers/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();
        const body = await request.json();

        // Use updateMany for safety with userId filtering
        const customer = await prisma.customer.updateMany({
            where: { id: params.id, companyId, userId },
            data: {
                name: body.name,
                companyName: body.companyName,
                email: body.email,
                phone: body.phone,
                address: body.address,
                type: body.type,
                notes: body.notes,
                contactPerson: body.contactPerson,
                phoneNumber: body.phoneNumber
            }
        });

        if (customer.count === 0) {
            return NextResponse.json({ message: 'Customer not found or permission denied' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Customer updated successfully' });
    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json({ message: 'Error updating customer' }, { status: 500 });
    }
}

// DELETE /api/manufacturing/customers/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { companyId, userId } = await requireManufacturingAccess();

        const count = await prisma.customer.deleteMany({
            where: { id: params.id, companyId, userId }
        });

        if (count.count === 0) {
            return NextResponse.json({ message: 'Customer not found or permission denied' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Customer deleted successfully' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json({ message: 'Error: Cannot delete customer with existing orders/projects.' }, { status: 500 });
    }
}
