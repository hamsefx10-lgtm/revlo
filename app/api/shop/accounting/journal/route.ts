import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
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
            return NextResponse.json({ error: 'No company found' }, { status: 400 });
        }

        const body = await req.json();
        const { date, reference, notes, lines } = body;

        if (!lines || lines.length < 2) {
            return NextResponse.json({ error: 'Journal must have at least 2 lines' }, { status: 400 });
        }

        const debitSum = lines.reduce((sum: number, l: any) => sum + Number(l.debit), 0);
        const creditSum = lines.reduce((sum: number, l: any) => sum + Number(l.credit), 0);

        if (Math.abs(debitSum - creditSum) > 0.01) {
            return NextResponse.json({ error: 'Journal entries must balance' }, { status: 400 });
        }

        const result = await prisma.$transaction(async (tx) => {
            for (const line of lines) {
                // Find account by ID (Frontend sends ID)
                const account = await tx.account.findFirst({
                    where: {
                        id: line.accountId,
                        companyId: user.companyId
                    }
                });

                if (account) {
                    const amount = line.debit > 0 ? line.debit : -line.credit;

                    await tx.transaction.create({
                        data: {
                            description: line.description || notes || 'Manual Journal Entry',
                            amount: amount,
                            transactionDate: new Date(date),
                            type: 'EXPENSE', // Fallback type
                            accountId: account.id,
                            companyId: user.companyId,
                            note: `${reference ? 'Ref: ' + reference : ''}. ${notes}`,
                            userId: session.user.id
                        }
                    });

                    await tx.account.update({
                        where: { id: account.id },
                        data: { balance: { increment: amount } }
                    });
                }
            }
            return true;
        });

        return NextResponse.json({ success: true, message: 'Journal posted successfully' });
    } catch (error) {
        console.error('Error posting journal:', error);
        return NextResponse.json({ error: 'Failed to post journal' }, { status: 500 });
    }
}
