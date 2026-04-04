import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const productId = params.id;

        const history = await prisma.saleItem.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: {
                sale: {
                    select: {
                        invoiceNumber: true,
                        customer: { select: { name: true } },
                        currency: true,
                        exchangeRate: true
                    }
                }
            }
        });

        return NextResponse.json({ history });
    } catch (error) {
        console.error('History Fetch Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
