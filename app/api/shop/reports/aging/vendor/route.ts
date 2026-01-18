import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { differenceInDays } from 'date-fns';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const bills = await prisma.purchaseOrder.findMany({
            where: {
                user: { companyId: user.companyId },
                paymentStatus: { in: ['Unpaid', 'Partial'] }
            },
            include: { vendor: true }
        });

        const buckets = {
            '1-30': 0,
            '31-60': 0,
            '61-90': 0,
            '90+': 0
        };

        const details = bills.map(bill => {
            const due = bill.expectedDelivery ? new Date(bill.expectedDelivery) : new Date(bill.createdAt);
            const overdueDays = Math.max(0, differenceInDays(new Date(), due));
            const amountDue = bill.total - bill.paidAmount;

            if (overdueDays <= 30) buckets['1-30'] += amountDue;
            else if (overdueDays <= 60) buckets['31-60'] += amountDue;
            else if (overdueDays <= 90) buckets['61-90'] += amountDue;
            else buckets['90+'] += amountDue;

            return {
                id: bill.id,
                vendor: bill.vendor?.name || 'Unknown',
                amountDue,
                overdueDays,
                poNumber: bill.poNumber
            };
        });

        return NextResponse.json({ buckets, details });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
