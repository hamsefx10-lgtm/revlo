import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/shop/accounts - List all accounts
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type');

        const where: any = { companyId: session.user.companyId };
        if (type && type !== 'All') where.type = type;

        const accounts = await prisma.account.findMany({
            where,
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/shop/accounts - Create new account
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });

        if (!user?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const body = await req.json();
        const { name, type, balance, currency, description } = body;

        if (!name || !type) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const initialBalance = parseFloat(balance) || 0;

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Account
            const account = await tx.account.create({
                data: {
                    name,
                    type,
                    balance: initialBalance,
                    currency: currency || 'ETB',
                    description,
                    companyId: user.companyId
                }
            });

            // 2. If Initial Balance exists, create Opening Balance Transaction
            if (initialBalance > 0) {
                await tx.transaction.create({
                    data: {
                        description: 'Opening Balance',
                        amount: initialBalance,
                        type: 'OTHER', // Represents Equity/Opening
                        category: 'Opening Balance',
                        accountId: account.id,
                        companyId: user.companyId,
                        userId: session.user.id,
                        transactionDate: new Date()
                    }
                });
            }

            return account;
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error) {
        console.error('Error creating account:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
