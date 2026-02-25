import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Helper to safe cast to Number
function toNumber(val: any): number {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'object' && val !== null && 'toNumber' in val) {
        return Number(val.toNumber());
    }
    const num = Number(val);
    return isNaN(num) ? 0 : num;
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = session.user.companyId;
        const url = new URL(req.url);

        // Date Logic (Cumulative)
        const dateParam = url.searchParams.get('date');
        const filterDate = dateParam ? new Date(dateParam) : new Date();
        filterDate.setHours(23, 59, 59, 999);

        // ==========================================
        // SECTION A: PERFORMANCE (PROFIT FLOW)
        // ==========================================

        // 1. REVENUE (Dakhliga)
        // ---------------------
        // CHANGE: Recognize Revenue from PAYMENTS received (Cash/Progress Basis).
        // Include ALL payments from projects (Active or Completed).
        const projectPayments = await prisma.payment.findMany({
            where: {
                project: { companyId },
                paymentDate: { lte: filterDate }
            }
        });
        const revenueProjects = projectPayments.reduce((sum, p) => sum + toNumber(p.amount), 0);

        // B. Shop Sales
        const sales = await prisma.sale.findMany({
            where: {
                user: { companyId },
                createdAt: { lte: filterDate }
            }
        });
        const revenueSales = sales.reduce((sum, s) => sum + toNumber(s.total), 0);

        // C. General Income (Transactions)
        // Include INCOME, TRANSFER_IN. (DEBT_REPAID is technically asset recovery, but often treated as cash inflow in Overview. We'll include INCOME for now to be safe, or match Overview exactly?)
        // Overview maps: ['INCOME', 'TRANSFER_IN', 'DEBT_REPAID']
        // Let's stick to true INCOME for Profit/Loss. DEBT_REPAID is Asset movement.
        // However, user said "Accounting page shows it". Overview uses all 3. 
        // Let's add 'INCOME' transactions as 'Other Revenue'.
        const incomeTransactions = await prisma.transaction.findMany({
            where: {
                companyId,
                transactionDate: { lte: filterDate },
                type: 'INCOME'
            }
        });
        const revenueGeneral = incomeTransactions.reduce((sum, t) => sum + toNumber(t.amount), 0);

        const totalRevenue = revenueProjects + revenueSales + revenueGeneral;


        // 2. DIRECT COSTS (COGS / Kharashka Mashaariicda)
        // -----------------------------------------------
        // All Project Expenses.
        const projectExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                projectId: { not: null }, // Linked to a project
                createdAt: { lte: filterDate }
            }
        });
        const totalDirectCosts = projectExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        // 3. GROSS PROFIT
        // ---------------
        const grossProfit = totalRevenue - totalDirectCosts;


        // 4. OPERATING EXPENSES (Kharashka Shirkadda)
        // -------------------------------------------
        // 4. OPERATING EXPENSES (Kharashka Shirkadda)
        // -------------------------------------------
        const operatingExpensesRaw = await prisma.expense.findMany({
            where: {
                companyId,
                projectId: null, // General
                customerId: null, // EXCLUDE Customer related expenses (Treat as Debt/Receivable)
                createdAt: { lte: filterDate },
                NOT: [
                    { category: { contains: 'Debt', mode: 'insensitive' } },
                    { category: { contains: 'Loan', mode: 'insensitive' } },
                    { category: { contains: 'Repayment', mode: 'insensitive' } },
                    { category: { contains: 'Capital', mode: 'insensitive' } },
                    { category: { contains: 'Withdrawal', mode: 'insensitive' } },
                    { category: { contains: 'Drawing', mode: 'insensitive' } }
                ]
            },
            select: { amount: true, category: true }
        });

        // Group by Category
        const opExMap = new Map<string, number>();
        let totalOpEx = 0;

        operatingExpensesRaw.forEach(e => {
            const val = toNumber(e.amount);
            const cat = e.category || 'General';
            opExMap.set(cat, (opExMap.get(cat) || 0) + val);
            totalOpEx += val;
        });

        const opExBreakdown = Array.from(opExMap.entries()).map(([key, val]) => ({
            label: key,
            value: val
        })).sort((a, b) => b.value - a.value);

        // 5. OPERATING PROFIT
        // -------------------
        const operatingProfit = grossProfit - totalOpEx;


        // 6. OTHER
        const otherExpenses = 0; // Placeholder

        // 7. NET PROFIT
        const netProfit = operatingProfit - otherExpenses;


        // ==========================================
        // SECTION B: FINANCIAL POSITION (BALANCE SHEET)
        // ==========================================

        // 1. ASSETS
        // ---------
        // A. Cash & Bank
        // Fetch ALL accounts to be safe against custom types (Mobile Money, E-Dahab, etc.)
        const allAccounts = await prisma.account.findMany({
            where: {
                companyId,
                isActive: true // Only active accounts
            }
        });

        // Filter for Asset Accounts (Exclude Equity, Liability if they exist in Account table)
        // Known types from debug: 'Mobile Money', 'Cash'.
        // We'll calculate sum for all that look like Assets.
        const assetAccounts = allAccounts.filter(acc => {
            const t = acc.type.toLowerCase();
            return t.includes('bank') || t.includes('cash') || t.includes('asset') || t.includes('mobile') || t.includes('money') || t.includes('wallet') || t.includes('e-');
        });

        const cashAndBank = assetAccounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);

        const cashBreakdown = assetAccounts.map(acc => ({
            label: acc.name, // e.g. "Qasnada", "E-birr"
            type: acc.type,
            value: toNumber(acc.balance)
        })).sort((a, b) => b.value - a.value);

        // B. Fixed Assets
        const fixedAssets = await prisma.fixedAsset.findMany({
            where: { companyId, purchaseDate: { lte: filterDate } }
        });
        const fixedAssetsTotal = fixedAssets.reduce((sum, fa) => sum + toNumber(fa.currentBookValue), 0);

        // C. Inventory
        const inventoryItems = await prisma.inventoryItem.findMany({ where: { companyId } });
        const inventoryTotal = inventoryItems.reduce((sum, item) => sum + (toNumber(item.inStock) * toNumber(item.purchasePrice)), 0);

        // D. Receivables
        // D1. Projects (Completed Only - unpaid balance)
        const completedProjects = await prisma.project.findMany({
            where: {
                companyId,
                status: 'Completed',
                updatedAt: { lte: filterDate }
            },
            include: { payments: true }
        });

        let projectsReceivable = 0;
        completedProjects.forEach(p => {
            const payments = p.payments.reduce((sum, pay) => sum + toNumber(pay.amount), 0);
            const advance = toNumber(p.advancePaid);
            const totalReceived = advance + payments;
            const val = toNumber(p.agreementAmount);
            const remaining = val - totalReceived;
            if (remaining > 0) projectsReceivable += remaining;
        });

        // D2. Cash Debts (Transactions)
        const customerDebts = await prisma.transaction.findMany({
            where: {
                companyId,
                transactionDate: { lte: filterDate },
                customerId: { not: null },
                OR: [{ type: 'DEBT_TAKEN' }, { type: 'DEBT_REPAID' }]
            }
        });
        let cashReceivables = 0;
        customerDebts.forEach(t => {
            const amt = toNumber(t.amount);
            if (t.type === 'DEBT_TAKEN') cashReceivables += amt;
            else if (t.type === 'DEBT_REPAID') cashReceivables -= amt;
        });

        // D3. Expense Debts (Expenses incurred for Customer, not Project)
        // These were previously in OpEx, moving to Receivables.
        const custExpenseQuery = {
            companyId,
            projectId: null,
            customerId: { not: null },
            createdAt: { lte: filterDate }
        };
        const customerExpenses = await prisma.expense.findMany({ where: custExpenseQuery });
        const expensesReceivable = customerExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        const totalReceivables = projectsReceivable + Math.max(0, cashReceivables) + expensesReceivable;
        const totalAssets = cashAndBank + fixedAssetsTotal + inventoryTotal + totalReceivables;


        // 2. LIABILITIES
        // --------------

        // A. Accounts Payable
        const unpaidExpenses = await prisma.expense.aggregate({
            where: {
                companyId,
                paymentStatus: 'UNPAID',
                createdAt: { lte: filterDate },
                NOT: [
                    { category: { contains: 'Debt', mode: 'insensitive' } },
                    { category: { contains: 'Loan', mode: 'insensitive' } }
                ]
            },
            _sum: { amount: true }
        });
        const unpaidExpenseTotal = toNumber(unpaidExpenses._sum.amount);

        const vendorDebts = await prisma.transaction.findMany({
            where: {
                companyId,
                transactionDate: { lte: filterDate },
                vendorId: { not: null },
                OR: [{ type: 'DEBT_TAKEN' }, { type: 'DEBT_REPAID' }]
            }
        });
        let vendorLoans = 0;
        vendorDebts.forEach(t => {
            const amt = toNumber(t.amount);
            if (t.type === 'DEBT_TAKEN') vendorLoans += amt;
            else if (t.type === 'DEBT_REPAID') vendorLoans -= amt;
        });
        vendorLoans = Math.max(0, vendorLoans);

        const accountsPayable = unpaidExpenseTotal + vendorLoans;

        // B. Unearned Revenue? 
        // REMOVED: Since we recognize Payments as Revenue immediately, we don't hold them as Liability.
        const unearnedRevenue = 0;

        const totalLiabilities = accountsPayable + unearnedRevenue;


        // 3. EQUITY
        // ---------
        const equityAccounts = await prisma.account.findMany({
            where: { companyId, type: 'EQUITY' }
        });
        const capital = equityAccounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);

        const retainedEarnings = netProfit;
        const totalEquity = capital + retainedEarnings;


        // RESPONSE STRUCTURE
        const responseData = {
            performance: {
                revenue: {
                    total: totalRevenue,
                    breakdown: [
                        { label: 'Project Income', value: revenueProjects },
                        { label: 'Shop Sales', value: revenueSales },
                        { label: 'General Income', value: revenueGeneral }
                    ].filter(i => i.value > 0).sort((a, b) => b.value - a.value)
                },
                directCosts: {
                    total: totalDirectCosts,
                    label: "Direct Project Costs"
                },
                grossProfit: grossProfit,
                operatingExpenses: {
                    total: totalOpEx,
                    label: "Company Operating Expenses",
                    breakdown: opExBreakdown
                },
                operatingProfit: operatingProfit,
                otherExpenses: otherExpenses,
                netProfit: netProfit
            },
            position: {
                assets: {
                    total: totalAssets,
                    breakdown: {
                        cash: cashAndBank,
                        cashBreakdown: cashBreakdown,
                        inventory: inventoryTotal,
                        projectReceivables: projectsReceivable,
                        customerReceivables: Math.max(0, cashReceivables) + expensesReceivable,
                        fixed: fixedAssetsTotal
                    }
                },
                liabilities: {
                    total: totalLiabilities,
                    breakdown: {
                        unpaidExpenses: unpaidExpenseTotal,
                        vendorLoans: vendorLoans,
                        unearnedRevenue: unearnedRevenue
                    }
                },
                equity: {
                    total: totalEquity,
                    breakdown: {
                        capital: capital,
                        netProfit: retainedEarnings
                    }
                }
            },
            period: { asOf: filterDate.toISOString().split('T')[0] }
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("FinancialSummary_Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
