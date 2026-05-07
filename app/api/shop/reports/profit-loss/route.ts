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
        const period = url.searchParams.get('period') || 'month'; // month, quarter, year, custom
        const startStr = url.searchParams.get('startDate');
        const endStr = url.searchParams.get('endDate');

        // Calculate date range
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

        // Get exchange rate for USD conversion
        const latestRate = await prisma.exchangeRate.findFirst({
            where: { companyId },
            orderBy: { date: 'desc' }
        });
        const usdToEtb = latestRate?.rate || 1;

        // ═══════════════════════════════════════════════
        // 1. REVENUE (Sales)
        // ═══════════════════════════════════════════════
        const sales = await prisma.sale.findMany({
            where: {
                companyId,
                status: 'Completed',
                createdAt: { gte: startDate, lte: endDate }
            },
            select: {
                subtotal: true,
                tax: true,
                total: true,
                currency: true,
                exchangeRate: true,
                items: { select: { quantity: true, costPrice: true, totalCost: true } }
            }
        });

        // Revenue = subtotal (pre-tax) — currency-aware
        const grossRevenue = sales.reduce((s, sale) => {
            const sub = n(sale.subtotal);
            return s + (sale.currency === 'USD' ? sub * (sale.exchangeRate || usdToEtb) : sub);
        }, 0);

        // Sales tax collected (not revenue, but shown for reference)
        const salesTax = sales.reduce((s, sale) => s + n(sale.tax), 0);

        // Sales discounts/returns (if tracked) — for now 0
        const salesReturns = 0;
        const netRevenue = grossRevenue - salesReturns;

        // ═══════════════════════════════════════════════
        // 2. COST OF GOODS SOLD
        // ═══════════════════════════════════════════════
        const cogs = sales.reduce((s, sale) =>
            s + sale.items.reduce((is, item) =>
                is + n(item.totalCost || (n(item.quantity) * n(item.costPrice))), 0), 0);

        const grossProfit = netRevenue - cogs;
        const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

        // ═══════════════════════════════════════════════
        // 3. OPERATING EXPENSES (from Expense table)
        // ═══════════════════════════════════════════════
        const expenses = await prisma.expense.findMany({
            where: {
                companyId,
                createdAt: { gte: startDate, lte: endDate }
            },
            select: {
                amount: true,
                description: true,
                category: true,
            }
        });

        // Group by category
        const expensesByCategory: Record<string, number> = {};
        let totalOperatingExpenses = 0;

        expenses.forEach(exp => {
            const amt = n(exp.amount);
            const cat = (exp as any).category?.name || 'Uncategorized';
            expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
            totalOperatingExpenses += amt;
        });

        // Sort categories by amount (descending)
        const expenseCategories = Object.entries(expensesByCategory)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);

        const operatingIncome = grossProfit - totalOperatingExpenses;

        // ═══════════════════════════════════════════════
        // 4. OTHER INCOME/EXPENSES (from Transaction table)
        // ═══════════════════════════════════════════════
        const otherTxs = await prisma.transaction.findMany({
            where: {
                companyId,
                type: { in: ['INCOME', 'EXPENSE'] },
                transactionDate: { gte: startDate, lte: endDate }
            },
            select: { type: true, amount: true, description: true, category: true }
        });

        let otherIncome = 0;
        let otherExpenses = 0;
        otherTxs.forEach(t => {
            if (t.type === 'INCOME') otherIncome += n(t.amount);
            if (t.type === 'EXPENSE') otherExpenses += n(t.amount);
        });

        // ═══════════════════════════════════════════════
        // 5. NET PROFIT
        // ═══════════════════════════════════════════════
        const netProfitBeforeTax = operatingIncome + otherIncome - otherExpenses;
        const incomeTax = 0; // No income tax tracking yet
        const netProfit = netProfitBeforeTax - incomeTax;
        const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

        // ═══════════════════════════════════════════════
        // PREVIOUS PERIOD COMPARISON
        // ═══════════════════════════════════════════════
        const periodLength = endDate.getTime() - startDate.getTime();
        const prevStart = new Date(startDate.getTime() - periodLength);
        const prevEnd = new Date(startDate.getTime() - 1);

        const prevSales = await prisma.sale.findMany({
            where: {
                companyId,
                status: 'Completed',
                createdAt: { gte: prevStart, lte: prevEnd }
            },
            select: { subtotal: true, currency: true, exchangeRate: true }
        });
        const prevRevenue = prevSales.reduce((s, sale) => {
            const sub = n(sale.subtotal);
            return s + (sale.currency === 'USD' ? sub * (sale.exchangeRate || usdToEtb) : sub);
        }, 0);

        const prevExpAgg = await prisma.expense.aggregate({
            where: { companyId, createdAt: { gte: prevStart, lte: prevEnd } },
            _sum: { amount: true }
        });
        const prevExpenses = n(prevExpAgg._sum.amount);

        const revenueGrowth = prevRevenue > 0 ? ((netRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        const expenseGrowth = prevExpenses > 0 ? ((totalOperatingExpenses - prevExpenses) / prevExpenses) * 100 : 0;

        return NextResponse.json({
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                label: period,
            },
            // ── INCOME STATEMENT ──
            revenue: {
                grossRevenue,
                salesReturns,
                netRevenue,
                salesTax, // informational
                salesCount: sales.length,
            },
            costOfGoodsSold: {
                total: cogs,
            },
            grossProfit: {
                value: grossProfit,
                margin: grossMargin,
            },
            operatingExpenses: {
                total: totalOperatingExpenses,
                categories: expenseCategories,
                count: expenses.length,
            },
            operatingIncome: {
                value: operatingIncome,
            },
            otherIncomeExpenses: {
                otherIncome,
                otherExpenses,
                net: otherIncome - otherExpenses,
            },
            netProfit: {
                beforeTax: netProfitBeforeTax,
                incomeTax,
                afterTax: netProfit,
                margin: netMargin,
            },
            // ── TRENDS ──
            trends: {
                revenueGrowth,
                expenseGrowth,
                prevRevenue,
                prevExpenses,
            }
        });

    } catch (error: any) {
        console.error('P&L Error:', error);
        return NextResponse.json({ error: 'Failed', details: error.message }, { status: 500 });
    }
}
