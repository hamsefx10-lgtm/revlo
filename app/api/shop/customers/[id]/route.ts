import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/shop/customers/[id]
export async function GET(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = context.params;

        // Fetch Customer with Purchase History
        const customer = await prisma.shopClient.findUnique({
            where: { id },
            include: {
                sales: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
        }

        // Calculate Aggregate Stats
        const stats = await prisma.sale.aggregate({
            where: { customerId: id },
            _sum: { total: true },
            _count: { id: true },
        });

        const totalSpent = Number(stats._sum.total) || 0;
        const totalOrders = stats._count.id || 0;
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

        return NextResponse.json({
            customer: {
                ...customer,
                sales: undefined
            },
            history: customer.sales,
            analytics: {
                totalSpent,
                totalOrders,
                averageOrderValue
            }
        });

    } catch (error) {
        console.error('Error fetching customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/shop/customers/[id] - Update Customer
export async function PUT(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = context.params;
        const body = await req.json();
        const { name, email, phone, address } = body;

        const customer = await prisma.shopClient.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address
            }
        });

        return NextResponse.json({ customer });

    } catch (error) {
        console.error('Error updating customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/shop/customers/[id]
export async function DELETE(
    req: NextRequest,
    context: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = context.params;

        // Check for dependencies (Sales)
        const salesCount = await prisma.sale.count({
            where: { customerId: id }
        });

        if (salesCount > 0) {
            return NextResponse.json({ error: 'Cannot delete customer with existing sales history.' }, { status: 400 });
        }

        await prisma.shopClient.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Customer deleted successfully' });

    } catch (error) {
        console.error('Error deleting customer:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
