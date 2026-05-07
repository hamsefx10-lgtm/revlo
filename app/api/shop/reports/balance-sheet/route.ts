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
        const companyId = user?.companyId;
        if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 404 });

        const url = new URL(req.url);
        const dateParam = url.searchParams.get('date');
        const asOf = dateParam ? new Date(dateParam) : new Date();
        asOf.setHours(23, 59, 59, 999);

        // ── Get current exchange rate from settings ──
        const latestRate = await prisma.exchangeRate.findFirst({
            where: { companyId },
            orderBy: { date: 'desc' }
        });
        const usdToEtb = latestRate?.rate || 1;

        // ═══════════════════════════════════════════════
        // 1. ASSETS
        // ═══════════════════════════════════════════════

        // 1A. Cash & Bank — currency-aware (USD accounts × exchangeRate)
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true },
            select: { id: true, name: true, balance: true, type: true, currency: true }
        });
        const cashAndBank = accounts.reduce((s, a) => {
            const bal = n(a.balance);
            return s + (a.currency === 'USD' ? bal * usdToEtb : bal);
        }, 0);
        const accountBreakdown = accounts.map(a => {
            const bal = n(a.balance);
            const etbValue = a.currency === 'USD' ? bal * usdToEtb : bal;
            return { name: a.name, value: etbValue, type: a.type, currency: a.currency, rawBalance: bal };
        });

        // 1B. Accounts Receivable — currency-aware (USD sales × exchangeRate)
        const unpaidSales = await prisma.sale.findMany({
            where: { companyId, paymentStatus: { not: 'Paid' }, createdAt: { lte: asOf } },
            select: { id: true, invoiceNumber: true, total: true, paidAmount: true, currency: true, exchangeRate: true }
        });
        const shopAR = unpaidSales.reduce((s, sale) => {
            const balance = Math.max(0, n(sale.total) - n(sale.paidAmount));
            return s + (sale.currency === 'USD' ? balance * (sale.exchangeRate || usdToEtb) : balance);
        }, 0);

        // 1C. Inventory — costPrice is already ETB (converted at purchase time) ✅
        const products = await prisma.product.findMany({
            where: { companyId, stock: { gt: 0 } },
            select: { name: true, stock: true, costPrice: true, costPriceUSD: true }
        });
        const inventoryValue = products.reduce((s, p) => s + (n(p.stock) * n(p.costPrice)), 0);
        const inventoryBreakdown = products.map(p => ({
            name: p.name,
            value: n(p.stock) * n(p.costPrice),
            qty: n(p.stock),
            costETB: n(p.costPrice),
            costUSD: n(p.costPriceUSD),
        }));

        // 1D. Fixed Assets — Original Cost & Accumulated Depreciation
        const fixedAssets = await prisma.fixedAsset.findMany({
            where: { companyId, purchaseDate: { lte: asOf } },
            select: { name: true, value: true, currentBookValue: true, type: true, depreciationRate: true }
        });
        const fixedAssetsOriginalCost = fixedAssets.reduce((s, fa) => s + n(fa.value), 0);
        const fixedAssetsBookValue = fixedAssets.reduce((s, fa) => s + n(fa.currentBookValue), 0);
        const accumulatedDepreciation = fixedAssetsOriginalCost - fixedAssetsBookValue;

        // ═══════════════════════════════════════════════
        // 2. LIABILITIES
        // ═══════════════════════════════════════════════

        // 2A. Accounts Payable — currency-aware (PO.total is in PO.currency)
        const unpaidPOs = await prisma.purchaseOrder.findMany({
            where: { companyId, paymentStatus: { not: 'Paid' }, createdAt: { lte: asOf } },
            select: { total: true, paidAmount: true, currency: true, exchangeRate: true }
        });
        const accountsPayable = unpaidPOs.reduce((s, po) => {
            const balance = Math.max(0, po.total - (po.paidAmount || 0));
            return s + (po.currency === 'USD' ? balance * (po.exchangeRate || usdToEtb) : balance);
        }, 0);

        // 2B. Tax Payable — from TaxReturn records (FILED but not PAID)
        const taxAgg = await prisma.sale.aggregate({
            where: { companyId, status: { not: 'Cancelled' }, createdAt: { lte: asOf } },
            _sum: { tax: true }
        });
        const totalTaxCollected = n(taxAgg._sum.tax);

        // Tax paid on purchases (Input VAT)
        const taxPaidOnPurchasesAgg = await prisma.purchaseOrder.aggregate({
            where: { companyId, status: { not: 'Cancelled' }, createdAt: { lte: asOf } },
            _sum: { tax: true }
        });
        const inputVAT = n(taxPaidOnPurchasesAgg._sum.tax);

        // Tax already remitted to government (PAID TaxReturns)
        const paidTaxReturns = await prisma.taxReturn.findMany({
            where: { companyId, status: 'PAID' },
            select: { taxDue: true }
        });
        const totalRemitted = paidTaxReturns.reduce((s, tr) => s + tr.taxDue, 0);

        // Net Tax Payable = Collected - Input VAT - Already Remitted
        const taxPayable = Math.max(0, totalTaxCollected - inputVAT - totalRemitted);

        // 2C. Pending Dividends
        const pendingDivAgg = await (prisma as any).shopDividend.aggregate({
            where: { companyId, status: 'Pending' },
            _sum: { amount: true }
        });
        const pendingDividends = n(pendingDivAgg._sum.amount);

        // 2D. Long-term loans
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

        // 3A. Shareholders Capital
        const shareholders = await (prisma as any).shopShareholder.findMany({
            where: { companyId, status: 'Active' },
            select: { name: true, sharePercentage: true, initialInvestment: true }
        });
        const shareholdersCapital = shareholders.reduce((s: number, sh: any) => s + n(sh.initialInvestment), 0);

        // 3B. Dividends Paid
        const paidDivAgg = await (prisma as any).shopDividend.aggregate({
            where: { companyId, status: 'Paid' },
            _sum: { amount: true }
        });
        const dividendsPaid = n(paidDivAgg._sum.amount);

        // 3C. Retained Earnings = Revenue − COGS − Expenses
        //     Revenue = sale.subtotal (pre-tax), costPrice is ETB ✅
        const salesData = await prisma.sale.findMany({
            where: { companyId, status: 'Completed', createdAt: { lte: asOf } },
            select: {
                subtotal: true, tax: true, currency: true, exchangeRate: true,
                items: { select: { quantity: true, costPrice: true, totalCost: true } }
            }
        });

        // Revenue in ETB (currency-aware)
        const shopRevenue = salesData.reduce((s, sale) => {
            const sub = n(sale.subtotal);
            return s + (sale.currency === 'USD' ? sub * (sale.exchangeRate || usdToEtb) : sub);
        }, 0);

        // COGS — costPrice is already ETB
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
        // TOTALS — Accounting Equation: Assets = Liabilities + Equity
        // ═══════════════════════════════════════════════
        const totalCurrentAssets = cashAndBank + shopAR + inventoryValue;
        const totalFixedAssets = fixedAssetsBookValue;
        const totalAssets = totalCurrentAssets + totalFixedAssets;

        const totalCurrentLiabilities = accountsPayable + taxPayable + pendingDividends;
        const totalLongTermLiabilities = Math.max(0, longTermLoans);
        const totalLiabilities = totalCurrentLiabilities + totalLongTermLiabilities;

        // Core tracked equity
        const trackedEquity = shareholdersCapital - dividendsPaid + retainedEarnings;

        // Opening Capital = unclassified initial balance (deposits, migration data)
        const openingCapital = totalAssets - totalLiabilities - trackedEquity;
        const totalEquity = trackedEquity + openingCapital;
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        const difference = totalAssets - totalLiabilitiesAndEquity;
        const isBalanced = Math.abs(difference) < 10;

        return NextResponse.json({
            asOf: asOf.toISOString(),
            isBalanced,
            difference,
            exchangeRate: usdToEtb,
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
                    originalCost: fixedAssetsOriginalCost,
                    accumulatedDepreciation,
                    value: fixedAssetsBookValue,
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
                        count: unpaidPOs.length,
                        drillType: 'CATEGORY'
                    },
                    taxPayable: {
                        value: taxPayable,
                        breakdown: {
                            taxCollected: totalTaxCollected,
                            inputVAT,
                            remitted: totalRemitted,
                        },
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
                openingCapital: {
                    value: openingCapital,
                },
                dividendsPaid: {
                    value: dividendsPaid,
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
