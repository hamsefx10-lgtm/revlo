import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET: List all financial accounts with their current balances
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const companyId = session.user.companyId;

        const accounts = await prisma.account.findMany({
            where: { companyId: session.user.companyId },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate real-time balance from Ledger if needed, 
        // but for now we trust the 'balance' field which we will update on every transaction.
        // A robust system would recalculate specific aggregate sums from the Transaction table to verify.

        return NextResponse.json(accounts);
    } catch (error) {
        console.error("Error fetching accounts:", error);
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

// POST: Create a new financial account (Bank, Cash, Mobile Money)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { name, type, accountNumber, currency, initialBalance } = body;

        // 1. Create the Account Record
        const newAccount = await prisma.account.create({
            data: {
                name,
                type, // CASH, BANK, MOBILE_MONEY
                // accountNumber, // Not in Account model
                currency: currency || 'USD', // Default to USD per schema
                balance: Number(initialBalance) || 0,
                companyId: session.user.companyId
            }
        });

        // 2. If there is an Initial Balance, Record it in the Ledger as "Equity In" or "Opening Balance"
        if (Number(initialBalance) > 0) {
            await prisma.transaction.create({
                data: {
                    description: `Opening Balance for ${name}`,
                    amount: Number(initialBalance),
                    type: 'OTHER', // considered Capital Injection or Opening Balance
                    category: 'Opening Balance',
                    // paymentMethod: type, // Removed: Not in Transaction model
                    // status: 'Completed', // Removed: Not in Transaction model
                    userId: session.user.id,
                    accountId: newAccount.id,
                    companyId: session.user.companyId
                    // In a real multi-table schema, we link companyId properly. 
                    // Based on schema, Transaction has companyId.
                }
            });
        }

        return NextResponse.json(newAccount);
    } catch (error) {
        console.error("Error creating account:", error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
