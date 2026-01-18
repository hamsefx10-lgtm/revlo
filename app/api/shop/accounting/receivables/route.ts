import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const receivables = await prisma.sale.findMany({
            where: {
                user: {
                    companyId: user.companyId
                },
                paymentStatus: { in: ['Unpaid', 'Partial'] }
            },
            include: {
                customer: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const formatted = receivables.map(r => ({
            id: r.id,
            customer: r.customer?.name || 'Walk-in Customer',
            invoiceNumber: r.invoiceNumber,
            total: r.total,
            paid: r.paidAmount,
            dueAmount: r.total - r.paidAmount,
            dueDate: r.dueDate,
            createdAt: r.createdAt,
            status: r.paymentStatus
        }));

        return NextResponse.json({ receivables: formatted });
    } catch (error) {
        console.error('Error fetching receivables:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
