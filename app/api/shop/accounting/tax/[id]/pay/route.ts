import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 400 });

        const taxReturn = await prisma.taxReturn.findFirst({
            where: { id: params.id, companyId: user.companyId }
        });
        if (!taxReturn) return NextResponse.json({ error: 'Tax return not found' }, { status: 404 });
        if (taxReturn.status === 'PAID') return NextResponse.json({ error: 'Already paid' }, { status: 400 });

        const body = await req.json();
        const { accountId, reference, amount } = body;

        if (!accountId) return NextResponse.json({ error: 'Account required' }, { status: 400 });

        const paymentAmount = amount || taxReturn.taxDue;

        // Verify account exists and has enough balance
        const account = await prisma.account.findFirst({
            where: { id: accountId, companyId: user.companyId, isActive: true }
        });
        if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        if (account.balance < paymentAmount) {
            return NextResponse.json({ error: `Insufficient balance. Account has ${account.balance}, need ${paymentAmount}` }, { status: 400 });
        }

        // Create transaction for the tax payment
        const transaction = await prisma.transaction.create({
            data: {
                type: 'EXPENSE',
                amount: paymentAmount,
                description: `Tax Remittance — ${taxReturn.reference || taxReturn.id}`,
                transactionDate: new Date(),
                companyId: user.companyId,
                accountId: accountId,
            }
        });

        // Deduct from account balance
        await prisma.account.update({
            where: { id: accountId },
            data: { balance: { decrement: paymentAmount } }
        });

        // Update TaxReturn status
        await prisma.taxReturn.update({
            where: { id: taxReturn.id },
            data: {
                status: 'PAID',
                paymentDate: new Date(),
                paymentTransactionId: transaction.id,
                reference: reference || taxReturn.reference,
            }
        });

        return NextResponse.json({
            success: true,
            message: `Tax payment of ETB ${paymentAmount.toLocaleString()} recorded successfully`,
            transaction,
        });

    } catch (error: any) {
        console.error('Tax payment error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process tax payment' }, { status: 500 });
    }
}
