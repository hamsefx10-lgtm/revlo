import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) return NextResponse.json({ error: 'No company found' }, { status: 400 });

        const companyId = user.companyId;

        // Get company tax rate
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { taxRate: true, name: true }
        });

        // 1. Total Tax Collected from ALL sales
        const taxCollectedAgg = await prisma.sale.aggregate({
            where: { companyId, status: { not: 'Cancelled' } },
            _sum: { tax: true }
        });
        const totalTaxCollected = taxCollectedAgg._sum.tax || 0;

        // 2. Total Tax Paid on purchases
        const taxPaidAgg = await prisma.purchaseOrder.aggregate({
            where: { companyId, status: { not: 'Cancelled' } },
            _sum: { tax: true }
        });
        const totalTaxPaidOnPurchases = taxPaidAgg._sum.tax || 0;

        // 3. Net Tax Due = Collected - Paid on Purchases - Remitted
        const taxReturns = await prisma.taxReturn.findMany({
            where: { companyId },
            orderBy: { filingDate: 'desc' }
        });

        const totalRemitted = taxReturns
            .filter(tr => tr.status === 'PAID')
            .reduce((s, tr) => s + tr.taxDue, 0);

        const netTaxDue = totalTaxCollected - totalTaxPaidOnPurchases - totalRemitted;

        // 4. Get accounts for payment dropdown
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            select: { id: true, name: true, balance: true, currency: true, type: true },
            orderBy: { name: 'asc' }
        });

        // Format history from TaxReturn records
        const history = taxReturns.map(tr => ({
            id: tr.id,
            period: `${new Date(tr.periodStart).toLocaleDateString()} — ${new Date(tr.periodEnd).toLocaleDateString()}`,
            periodStart: tr.periodStart,
            periodEnd: tr.periodEnd,
            taxCollected: tr.taxCollected,
            taxPaid: tr.taxPaid,
            taxDue: tr.taxDue,
            status: tr.status,
            date: tr.filingDate,
            paymentDate: tr.paymentDate,
            reference: tr.reference,
        }));

        return NextResponse.json({
            stats: {
                taxDue: netTaxDue,
                taxCollected: totalTaxCollected,
                taxPaid: totalTaxPaidOnPurchases,
                totalRemitted,
                pendingReturns: taxReturns.filter(tr => tr.status === 'FILED').length,
            },
            rates: [
                { name: 'Standard VAT', rate: company?.taxRate || 15, description: 'Canshuurta Iibka (Sales Tax)' },
                { name: 'Withholding', rate: 2, description: 'Iibsashada > 10k (Purchases > 10k)' }
            ],
            history,
            accounts,
        });
    } catch (error) {
        console.error('Error fetching tax data:', error);
        return NextResponse.json({ error: 'Failed to fetch tax data' }, { status: 500 });
    }
}
