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

        // Always resolve companyId from DB (shop pattern)
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { companyId: true }
        });
        const companyId = user?.companyId;
        if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const url = new URL(req.url);
        const dateParam = url.searchParams.get('date');
        const asOf = dateParam ? new Date(dateParam) : new Date();
        asOf.setHours(23, 59, 59, 999);

        // ═══════════════════════════════════════════════
        // 1. ASSETS
        // ═══════════════════════════════════════════════

        // 1A. Cash & Bank — sum of all Account balances
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            select: { id: true, name: true, balance: true, type: true }
        });
        const cashAndBank = accounts.reduce((s, a) => s + n(a.balance), 0);
        const accountBreakdown = accounts.map(a => ({ name: a.name, value: n(a.balance), type: a.type }));

        // 1B. Shop Accounts Receivable — unpaid sales
        const unpaidSales = await prisma.sale.findMany({
            where: {
                companyId,
                paymentStatus: { not: 'Paid' },
                createdAt: { lte: asOf }
            },
            select: { id: true, invoiceNumber: true, total: true, paidAmount: true }
        });
        const shopAR = unpaidSales.reduce((s, sale) => s + Math.max(0, n(sale.total) - n(sale.paidAmount)), 0);

        // 1C. Shop Inventory — Product stock × cost price (FIXED: was using inventoryItem)
        const products = await prisma.product.findMany({
            where: { companyId, stock: { gt: 0 } },
            select: { name: true, stock: true, costPrice: true }
        });
        const inventoryValue = products.reduce((s, p) => s + (n(p.stock) * n(p.costPrice)), 0);
        const inventoryBreakdown = products.map(p => ({
            name: p.name,
            value: n(p.stock) * n(p.costPrice),
            qty: n(p.stock)
        }));

        // 1D. Fixed Assets (book value)
        const fixedAssets = await prisma.fixedAsset.findMany({
            where: { companyId, purchaseDate: { lte: asOf } },
            select: { name: true, currentBookValue: true, type: true }
        });
        const fixedAssetsValue = fixedAssets.reduce((s, fa) => s + n(fa.currentBookValue), 0);

        // ═══════════════════════════════════════════════
        // 2. LIABILITIES
        // ═══════════════════════════════════════════════

        // 2A. Accounts Payable — unpaid expenses
        const unpaidExpenses = await prisma.expense.findMany({
            where: { companyId, paymentStatus: 'UNPAID', createdAt: { lte: asOf } },
            select: { description: true, amount: true, category: true }
        });
        const accountsPayable = unpaidExpenses.reduce((s, e) => s + n(e.amount), 0);

        // 2B. Tax Payable — cumulative tax collected on all sales
        const taxAgg = await prisma.sale.aggregate({
            where: { companyId, createdAt: { lte: asOf } },
            _sum: { tax: true }
        });
        const taxPayable = n(taxAgg._sum.tax);

        // 2C. Pending Dividends (new — from ShopDividend)
        const pendingDivAgg = await (prisma as any).shopDividend.aggregate({
            where: { companyId, status: 'Pending' },
            _sum: { amount: true }
        });
        const pendingDividends = n(pendingDivAgg._sum.amount);

        // 2D. Long-term loans (DEBT_TAKEN - DEBT_REPAID transactions)
        const loanTxs = await prisma.transaction.findMany({
            where: {
                companyId,
                type: { in: ['DEBT_TAKEN', 'DEBT_REPAID'] },
                transactionDate: { lte: asOf }
            },
            select: { type: true, amount: true }
        });
        const longTermLoans = loanTxs.reduce((s, t) => {
            if (t.type === 'DEBT_TAKEN') return s + n(t.amount);
            if (t.type === 'DEBT_REPAID') return s - n(t.amount);
            return s;
        }, 0);

        // ═══════════════════════════════════════════════
        // 3. EQUITY
        // ═══════════════════════════════════════════════

        // 3A. Shareholders Capital — from ShopShareholder (FIXED: was using transactions)
        const shareholders = await (prisma as any).shopShareholder.findMany({
            where: { companyId, status: 'Active' },
            select: { name: true, sharePercentage: true, initialInvestment: true }
        });
        const shareholdersCapital = shareholders.reduce((s: number, sh: any) => s + n(sh.initialInvestment), 0);

        // 3B. Dividends Paid (reduces equity)
        const paidDivAgg = await (prisma as any).shopDividend.aggregate({
            where: { companyId, status: 'Paid' },
            _sum: { amount: true }
        });
        const dividendsPaid = n(paidDivAgg._sum.amount);

        // 3C. Retained Earnings = Shop Revenue − COGS − All Expenses
        const salesData = await prisma.sale.findMany({
            where: { companyId, status: 'Completed', createdAt: { lte: asOf } },
            select: { subtotal: true, tax: true, items: { select: { quantity: true, costPrice: true, totalCost: true } } }
        });
        const shopRevenue = salesData.reduce((s, sale) => s + n(sale.subtotal), 0);
        const cogs = salesData.reduce((s, sale) =>
            s + sale.items.reduce((is, item) => is + n(item.totalCost || (n(item.quantity) * n(item.costPrice))), 0), 0);

        const allExpenses = await prisma.expense.aggregate({
            where: { companyId, createdAt: { lte: asOf } },
            _sum: { amount: true }
        });
        const totalExpenses = n(allExpenses._sum.amount);
        const grossProfit = shopRevenue - cogs;
        const retainedEarnings = grossProfit - totalExpenses;

        // ═══════════════════════════════════════════════
        // TOTALS
        // ═══════════════════════════════════════════════
        const totalCurrentAssets = cashAndBank + shopAR + inventoryValue;
        const totalFixedAssets = fixedAssetsValue;
        const totalAssets = totalCurrentAssets + totalFixedAssets;

        const totalCurrentLiabilities = accountsPayable + taxPayable + pendingDividends;
        const totalLongTermLiabilities = Math.max(0, longTermLoans);
        const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

        const totalEquity = shareholdersCapital - dividendsPaid + retainedEarnings;
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 5;

        return NextResponse.json({
            asOf: asOf.toISOString(),
            isBalanced,
            difference: totalAssets - totalLiabilitiesAndEquity,
            // ── ASSETS ──────────────────────────────────────
            assets: {
                current: {
                    cashAndBank: {
                        value: cashAndBank,
                        breakdown: accountBreakdown,
                        drillType: 'ACCOUNT'
                    },
                    accountsReceivable: {
                        value: shopAR,
                        count: unpaidSales.length,
                        drillType: 'CUSTOMER'
                    },
                    inventory: {
                        value: inventoryValue,
                        skuCount: products.length,
                        breakdown: inventoryBreakdown.slice(0, 5),
                        drillType: 'INVENTORY'
                    },
                },
                fixed: {
                    value: fixedAssetsValue,
                    count: fixedAssets.length,
                    drillType: 'ASSET'
                },
                totalCurrent: totalCurrentAssets,
                totalFixed: totalFixedAssets,
                total: totalAssets,
            },
            // ── LIABILITIES ──────────────────────────────────
            liabilities: {
                current: {
                    accountsPayable: {
                        value: accountsPayable,
                        count: unpaidExpenses.length,
                        drillType: 'CATEGORY'
                    },
                    taxPayable: {
                        value: taxPayable,
                        drillType: 'TAX'
                    },
                    pendingDividends: {
                        value: pendingDividends,
                        drillType: 'DIVIDEND'
                    },
                },
                longTerm: {
                    value: Math.max(0, longTermLoans),
                    drillType: 'ACCOUNT'
                },
                totalCurrent: totalCurrentLiabilities,
                totalLongTerm: totalLongTermLiabilities,
                total: totalLiabilities,
            },
            // ── EQUITY ───────────────────────────────────────
            equity: {
                shareholdersCapital: {
                    value: shareholdersCapital,
                    shareholders: shareholders.map((s: any) => ({ name: s.name, pct: s.sharePercentage, investment: n(s.initialInvestment) })),
                },
                dividendsPaid: {
                    value: -dividendsPaid, // negative (reduces equity)
                },
                retainedEarnings: {
                    value: retainedEarnings,
                    breakdown: {
                        revenue: shopRevenue,
                        cogs,
                        grossProfit,
                        expenses: totalExpenses,
                    },
                },
                total: totalEquity,
            },
            // ── SUMMARY ──────────────────────────────────────
            summary: {
                totalAssets,
                totalLiabilitiesAndEquity,
                grossProfit,
                netProfit: retainedEarnings,
                debtRatio: totalAssets > 0 ? (totalLiabilities / totalAssets) : 0,
            }
        });

    } catch (error: any) {
        console.error('BalanceSheet_Error:', error);
        return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
    }
}
