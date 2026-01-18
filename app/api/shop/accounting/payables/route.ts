import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const payables = await prisma.purchaseOrder.findMany({
            where: {
                user: {
                    companyId: user.companyId
                },
                paymentStatus: { in: ['Unpaid', 'Partial'] }
            },
            include: {
                vendor: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = payables.map(p => ({
            id: p.id,
            vendor: p.vendor?.name || 'Unknown Vendor',
            poNumber: p.poNumber,
            total: p.total,
            paid: p.paidAmount,
            dueAmount: p.total - p.paidAmount,
            dueDate: p.expectedDelivery || p.createdAt, // Fallback as we don't have explicit due date on PO yet
            createdAt: p.createdAt,
            status: p.paymentStatus
        }));

        return NextResponse.json({ payables: formatted });
    } catch (error) {
        console.error('Error fetching payables:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
