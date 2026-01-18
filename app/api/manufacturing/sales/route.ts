import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ orders: [] });
        }

        const sales = await prisma.sale.findMany({
            where: {
                user: { companyId: user.companyId }
            },
            include: {
                customer: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Format for frontend
        const formattedSales = sales.map(sale => ({
            id: sale.invoiceNumber,
            customer: sale.customer?.name || 'Walk-in Customer',
            date: sale.createdAt.toISOString().split('T')[0],
            total: Number(sale.total),
            status: sale.paymentStatus === 'Paid' ? 'Completed' : 'Pending',
            items: sale.items.reduce((sum, item) => sum + item.quantity, 0)
        }));

        return NextResponse.json({ orders: formattedSales });
    } catch (error) {
        console.error('Error fetching sales:', error);
        return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { customerId, items, date, status } = body;
        // items: { productId, productName, quantity, unitPrice }[]

        const total = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

        const sale = await prisma.sale.create({
            data: {
                invoiceNumber,
                userId: session.user.id, // Linked to user, user linked to company
                customerId: customerId || null,
                subtotal: total,
                tax: 0, // Simplified for now
                total: total,
                paymentStatus: status === 'Completed' ? 'Paid' : 'Unpaid',
                status: 'Completed',
                createdAt: new Date(date),
                items: {
                    create: items.map((item: any) => ({
                        productId: item.productId, // assumes productId is valid UUID of existing Product
                        productName: item.productName,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        total: Number(item.quantity) * Number(item.unitPrice)
                    }))
                }
            }
        });

        return NextResponse.json({ success: true, sale });
    } catch (error) {
        console.error('Error creating sale:', error);
        return NextResponse.json({ error: 'Failed to create sale: ' + (error as Error).message }, { status: 500 });
    }
}
