import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function n(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object' && 'toNumber' in val) return Number(val.toNumber());
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        if (!user?.companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });
        const companyId = user.companyId;

        const url = new URL(req.url);
        const period = url.searchParams.get('period') || 'month';
        const startStr = url.searchParams.get('startDate');
        const endStr = url.searchParams.get('endDate');

        const now = new Date();
        let startDate: Date, endDate: Date;

        if (startStr && endStr) {
            startDate = new Date(startStr);
            endDate = new Date(endStr);
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        } else if (period === 'quarter') {
            const q = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), q * 3, 1);
            endDate = new Date(now.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        // Get exchange rate
        const latestRate = await prisma.exchangeRate.findFirst({
            where: { companyId },
            orderBy: { date: 'desc' }
        });
        const usdToEtb = latestRate?.rate || 1;

        // ═══════════════════════════════════════════════
        // A. OPERATING ACTIVITIES
        // ═══════════════════════════════════════════════

        // Cash IN from Sales (paid amounts in period)
        const paidSales = await prisma.sale.findMany({
            where: {
                companyId,
                status: 'Completed',
                createdAt: { gte: startDate, lte: endDate }
            },
            select: { paidAmount: true, total: true, currency: true, exchangeRate: true, paymentStatus: true }
        });

        const cashFromSales = paidSales.reduce((s, sale) => {
            const paid = sale.paymentStatus === 'Paid' ? n(sale.total) : n(sale.paidAmount);
            return s + (sale.currency === 'USD' ? paid * (sale.exchangeRate || usdToEtb) : paid);
        }, 0);

        // Cash OUT for Expenses
        const expenseAgg = await prisma.expense.aggregate({
            where: { companyId, createdAt: { gte: startDate, lte: endDate } },
            _sum: { amount: true }
        });
        const cashForExpenses = n(expenseAgg._sum.amount);

        // Cash OUT for Tax Remittance
        const paidTaxReturns = await prisma.taxReturn.findMany({
            where: {
                companyId,
                status: 'PAID',
                paymentDate: { gte: startDate, lte: endDate }
            },
            select: { taxDue: true }
        });
        const cashForTaxes = paidTaxReturns.reduce((s, tr) => s + tr.taxDue, 0);

        const netOperating = cashFromSales - cashForExpenses - cashForTaxes;

        // ═══════════════════════════════════════════════
        // B. INVESTING ACTIVITIES
        // ═══════════════════════════════════════════════

        // Cash OUT for Inventory Purchases (PO paid amounts)
        const paidPOs = await prisma.purchaseOrder.findMany({
            where: {
                companyId,
                createdAt: { gte: startDate, lte: endDate }
            },
            select: { paidAmount: true, currency: true, exchangeRate: true }
        });
        const cashForInventory = paidPOs.reduce((s, po) => {
            const paid = n(po.paidAmount);
            return s + (po.currency === 'USD' ? paid * (po.exchangeRate || usdToEtb) : paid);
        }, 0);

        // Cash OUT for Fixed Assets
        const fixedAssetsPurchased = await prisma.fixedAsset.findMany({
            where: {
                companyId,
                purchaseDate: { gte: startDate, lte: endDate }
            },
            select: { value: true }
        });
        const cashForAssets = fixedAssetsPurchased.reduce((s, fa) => s + n(fa.value), 0);

        const netInvesting = -(cashForInventory + cashForAssets);

        // ═══════════════════════════════════════════════
        // C. FINANCING ACTIVITIES
        // ═══════════════════════════════════════════════

        // Capital Contributions (new shareholders)
        const capitalTxs = await prisma.transaction.findMany({
            where: {
                companyId,
                type: { in: ['INCOME'] },
                category: 'Capital Contribution',
                transactionDate: { gte: startDate, lte: endDate }
            },
            select: { amount: true }
        });
        const capitalContributions = capitalTxs.reduce((s, t) => s + n(t.amount), 0);

        // Loans
        const loanTxs = await prisma.transaction.findMany({
            where: {
                companyId,
                type: { in: ['DEBT_TAKEN', 'DEBT_REPAID'] },
                transactionDate: { gte: startDate, lte: endDate }
            },
            select: { type: true, amount: true }
        });
        const loansReceived = loanTxs.filter(t => t.type === 'DEBT_TAKEN').reduce((s, t) => s + n(t.amount), 0);
        const loansRepaid = loanTxs.filter(t => t.type === 'DEBT_REPAID').reduce((s, t) => s + n(t.amount), 0);

        // Dividends Paid
        const dividendsPaid = await (prisma as any).shopDividend.findMany({
            where: {
                companyId,
                status: 'Paid',
                paidDate: { gte: startDate, lte: endDate }
            },
            select: { amount: true }
        });
        const cashForDividends = dividendsPaid.reduce((s: number, d: any) => s + n(d.amount), 0);

        const netFinancing = capitalContributions + loansReceived - loansRepaid - cashForDividends;

        // ═══════════════════════════════════════════════
        // NET CHANGE + BALANCES
        // ═══════════════════════════════════════════════
        const netChange = netOperating + netInvesting + netFinancing;

        // Current Cash Position (all accounts)
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            select: { name: true, balance: true, currency: true }
        });
        const endingCash = accounts.reduce((s, a) => {
            const bal = n(a.balance);
            return s + (a.currency === 'USD' ? bal * usdToEtb : bal);
        }, 0);
        const beginningCash = endingCash - netChange;

        return NextResponse.json({
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                label: period,
            },
            operating: {
                cashFromSales,
                cashForExpenses,
                cashForTaxes,
                net: netOperating,
                items: [
                    { label: 'Lacag ka soo gashay Iibka (Sales)', value: cashFromSales, type: 'in' },
                    { label: 'Kharashaadka Hawlaha (Expenses)', value: -cashForExpenses, type: 'out' },
                    { label: 'Canshuur la bixiyay (Tax Paid)', value: -cashForTaxes, type: 'out' },
                ]
            },
            investing: {
                cashForInventory,
                cashForAssets,
                net: netInvesting,
                items: [
                    { label: 'Iibsashada Alaabta (Purchases)', value: -cashForInventory, type: 'out' },
                    { label: 'Hanti la gatay (Fixed Assets)', value: -cashForAssets, type: 'out' },
                ]
            },
            financing: {
                capitalContributions,
                loansReceived,
                loansRepaid,
                cashForDividends,
                net: netFinancing,
                items: [
                    ...(capitalContributions > 0 ? [{ label: 'Raasamaal Cusub (Capital)', value: capitalContributions, type: 'in' }] : []),
                    ...(loansReceived > 0 ? [{ label: 'Amaah la helay (Loans)', value: loansReceived, type: 'in' }] : []),
                    ...(loansRepaid > 0 ? [{ label: 'Amaah la bixiyay (Repaid)', value: -loansRepaid, type: 'out' }] : []),
                    ...(cashForDividends > 0 ? [{ label: 'Dividend la bixiyay', value: -cashForDividends, type: 'out' }] : []),
                ]
            },
            summary: {
                netChange,
                beginningCash,
                endingCash,
            },
            accounts: accounts.map(a => ({
                name: a.name,
                balance: a.currency === 'USD' ? n(a.balance) * usdToEtb : n(a.balance),
                currency: a.currency,
                rawBalance: n(a.balance),
            }))
        });

    } catch (error: any) {
        console.error('CashFlow Error:', error);
        return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
    }
}
