import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';




export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const remainingCount = await prisma.expense.count({
            where: {
                OR: [
                    { paymentStatus: 'UNPAID' },
                    { paymentStatus: null }
                ],
                paidFrom: {
                    not: '',
                },
            }
        });

        const sample = await prisma.expense.findFirst({
            where: {
                OR: [
                    { paymentStatus: 'UNPAID' },
                    { paymentStatus: null }
                ],
                paidFrom: {
                    not: '',
                },
            },
            select: {
                id: true,
                paymentStatus: true,
                paidFrom: true,
                amount: true,
                description: true,
            }
        });

        return NextResponse.json({
            remaining: remainingCount,
            sample: sample,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
