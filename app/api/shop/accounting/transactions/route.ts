import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
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
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const type = searchParams.get('type');
        const accountId = searchParams.get('accountId');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: any = {
            companyId: user.companyId
        };

        if (startDate && endDate) {
            where.transactionDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        if (type && type !== 'All') {
            where.type = type;
        }

        if (accountId && accountId !== 'All') {
            where.accountId = accountId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                account: { select: { name: true, type: true } },
                user: { select: { fullName: true } }
            },
            orderBy: { transactionDate: 'desc' },
            take: limit
        });

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
