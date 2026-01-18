import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const accountId = params.id;

        const account = await prisma.account.findUnique({
            where: { id: accountId },
            include: {
                transactions: {
                    orderBy: { transactionDate: 'desc' },
                    take: 50 // Limit to last 50 transactions for performance
                }
            }
        });

        if (!account) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch (error) {
        console.error("Error fetching account:", error);
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}
