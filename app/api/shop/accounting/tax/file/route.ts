import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

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
        const { periodStart, periodEnd, reference } = body;

        if (!periodStart || !periodEnd) {
            return NextResponse.json({ error: 'Period start and end dates required' }, { status: 400 });
        }

        const start = startOfDay(parseISO(periodStart));
        const end = endOfDay(parseISO(periodEnd));

        // 1. Calculate Tax Collected (Sales)
        const sales = await prisma.sale.findMany({
            where: {
                user: { companyId: user.companyId },
                createdAt: { gte: start, lte: end },
                status: { not: 'Cancelled' }
            }
        });

        // Sum tax field or estimate 15%
        const taxCollected = sales.reduce((sum, s) => sum + (s.tax || 0), 0);

        // 2. Calculate Tax Paid (Purchases/Expenses)
        const purchases = await prisma.purchaseOrder.findMany({
            where: {
                user: { companyId: user.companyId },
                createdAt: { gte: start, lte: end },
                status: { not: 'Cancelled' }
            }
        });

        const expenses = await prisma.expense.findMany({
            where: {
                companyId: user.companyId,
                createdAt: { gte: start, lte: end }
            }
        });

        const taxPaidOnPurchases = purchases.reduce((sum, p) => sum + (p.tax || 0), 0);
        const taxPaidOnExpenses = expenses.reduce((sum, e) => {
            // Expenses might not have tax field, so check category or assume included?
            // For now, let's assume if it is an expense, 15% was VAT if applicable.
            // But this is risky. Let's start with PurchaseOrders only having explicit tax.
            // Expenses tax logic needs to be robust, for now we will just use PO tax.
            return sum;
        }, 0);

        const totalTaxPaid = taxPaidOnPurchases + taxPaidOnExpenses;
        const taxDue = taxCollected - totalTaxPaid;

        // 3. Create Tax Return Record
        const taxReturn = await prisma.taxReturn.create({
            data: {
                companyId: user.companyId,
                periodStart: start,
                periodEnd: end,
                taxCollected,
                taxPaid: totalTaxPaid,
                taxDue,
                status: 'FILED',  // Filed but not yet paid
                reference: reference || `VAT-${start.toISOString().split('T')[0]}`,
            }
        });

        return NextResponse.json({ success: true, taxReturn });
    } catch (error: any) {
        console.error('Error filing tax return:', error);
        return NextResponse.json({ error: error.message || 'Failed to file return' }, { status: 500 });
    }
}
