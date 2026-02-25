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

        // Date Logic
        const dateParam = url.searchParams.get('date');
        const filterDate = dateParam ? new Date(dateParam) : new Date();
        filterDate.setHours(23, 59, 59, 999);

        // ==========================================
        // 1. CALCULATE NET PROFIT (RETAINED EARNINGS)
        // ==========================================

        // A. REVENUE
        // 1. Completed Projects Revenue
        const completedProjects = await prisma.project.findMany({
            where: {
                companyId,
                status: 'Completed',
                updatedAt: { lte: filterDate }
            },
            include: { payments: true }
        });
        const projectRevenue = completedProjects.reduce((sum, p) => sum + toNumber(p.agreementAmount), 0);

        // 2. Shop/General Sales Revenue
        const sales = await prisma.sale.findMany({
            where: {
                user: { companyId },
                createdAt: { lte: filterDate }
            }
        });
        const shopRevenue = sales.reduce((sum, s) => sum + toNumber(s.total), 0);

        const totalRevenue = projectRevenue + shopRevenue;


        // B. EXPENSES (COGS + OpEx)
        // User Logic Update: "Active Projects are not Assets".
        // IMPLICATION: Treat Active Project Expenses as IMMEDIATE EXPENSES (P&L), not WIP (Asset).

        const recognizedExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                createdAt: { lte: filterDate },
                // We now include ALL projects (Active & Completed). No filtering by projectId.
                // But we still exclude Non-Operating Categories (Debt, Loan, Capital)
                NOT: [
                    { category: { contains: 'Debt', mode: 'insensitive' } },
                    { category: { contains: 'Loan', mode: 'insensitive' } },
                    { category: { contains: 'Repayment', mode: 'insensitive' } },
                    { category: { contains: 'Capital', mode: 'insensitive' } },
                    { category: { contains: 'Withdrawal', mode: 'insensitive' } },
                    { category: { contains: 'Drawing', mode: 'insensitive' } }
                ]
            }
        });

        const totalRecognizedExpenses = recognizedExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        // C. NET PROFIT (Retained Earnings)
        // Revenue - (Completed Project Exp + Active Project Exp + General Exp)
        const netProfit = totalRevenue - totalRecognizedExpenses;


        // ==========================================
        // 2. ASSETS
        // ==========================================

        // A. Cash & Bank
        const accounts = await prisma.account.findMany({
            where: {
                companyId,
                type: { in: ['ASSET', 'BANK', 'CASH'] }
            }
        });
        const cashAndBank = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);

        // B. Fixed Assets
        const fixedAssets = await prisma.fixedAsset.findMany({
            where: { companyId, purchaseDate: { lte: filterDate } }
        });
        const fixedAssetsTotal = fixedAssets.reduce((sum, fa) => sum + toNumber(fa.currentBookValue), 0);

        // C. Inventory
        const inventoryItems = await prisma.inventoryItem.findMany({ where: { companyId } });
        const inventoryTotal = inventoryItems.reduce((sum, item) => sum + (toNumber(item.inStock) * toNumber(item.purchasePrice)), 0);

        // D. ACCOUNTS RECEIVABLE
        // 1. Completed Projects (Unpaid portion)
        let projectsReceivable = 0;
        completedProjects.forEach(p => {
            const payments = p.payments.reduce((sum, pay) => sum + toNumber(pay.amount), 0);
            const advance = toNumber(p.advancePaid);
            const totalReceived = advance + payments;
            const val = toNumber(p.agreementAmount);
            const remaining = val - totalReceived;
            if (remaining > 0) projectsReceivable += remaining;
        });

        // 2. Cash Debts (Customers took debt)
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
        cashReceivables = Math.max(0, cashReceivables);

        const totalReceivables = projectsReceivable + cashReceivables;

        // NO WIP ASSET (Removed per user instruction)
        const totalAssets = cashAndBank + fixedAssetsTotal + inventoryTotal + totalReceivables;


        // ==========================================
        // 3. LIABILITIES
        // ==========================================

        // A. Accounts Payable (Unpaid Expenses + Vendor Debts)

        // 1. Unpaid Expenses
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

        // 2. Vendor Cash Debts (Loans from Vendors)
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

        const totalAccountsPayable = unpaidExpenseTotal + vendorLoans;

        // B. UNEARNED REVENUE (Active Project Advances)
        // User said Active Projects are not Asset (WIP).
        // But the Advance received IS Cash (Asset). To balance, we still need a Liability (Unearned Revenue).
        // Unless user considers Advance as REVENUE immediately?
        // User said: "Dakhliga inaso galay...".
        // Let's Keep as Liability for now to be safe (Unearned Revenue).

        const activeProjects = await prisma.project.findMany({
            where: {
                companyId,
                status: { not: 'Completed' },
                createdAt: { lte: filterDate }
            }
        });

        let totalUnearnedRevenue = 0;
        activeProjects.forEach(p => {
            const advance = toNumber(p.advancePaid);
            // We do NOT subtract expenses here anymore, because Expenses are now fully recognized in P&L.
            // So the FULL Advance is Unearned Revenue (Liability).
            // Wait, if we recognized Expense in P&L, Equity is reduced. 
            // Cash is +Advance, -Expense.
            // Asset = (Cash). 
            // Liability = (Unearned Revenue = Advance).
            // Equity = (Revenue 0 - Expense).
            // Balance Check: 
            // Asset (Adv - Exp) ?= Liab (Adv) + Equity (-Exp)
            // Adv - Exp = Adv - Exp. IT BALANCES!
            // Correct Logic: Unearned Revenue = Full Advance Amount.
            totalUnearnedRevenue += advance;
        });

        const totalLiabilities = totalAccountsPayable + totalUnearnedRevenue;


        // ==========================================
        // 4. EQUITY
        // ==========================================

        const equityAccounts = await prisma.account.findMany({
            where: { companyId, type: 'EQUITY' }
        });
        const capital = equityAccounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);

        const retainedEarnings = netProfit;
        const totalEquity = capital + retainedEarnings;


        const responseData = {
            period: { asOf: filterDate.toISOString().split('T')[0] },
            assets: {
                current: {
                    cashAndBank: { value: cashAndBank, drillType: 'account', drillLink: '/reports/cashbook' },
                    inventory: { value: inventoryTotal, drillType: 'inventory', drillLink: '/reports/inventory' },
                    // WIP Removed
                    workInProgress: { value: 0, drillType: 'none', drillLink: '#' },
                    accountsReceivable: {
                        value: totalReceivables,
                        drillType: 'customer',
                        drillLink: '/reports/debts',
                        breakdown: {
                            projects: projectsReceivable,
                            cash: cashReceivables
                        }
                    }
                },
                fixed: { value: fixedAssetsTotal, drillType: 'asset', drillLink: '/reports/fixed-assets' },
                total: totalAssets
            },
            liabilities: {
                current: {
                    accountsPayable: {
                        value: totalAccountsPayable,
                        drillType: 'payables',
                        drillLink: '/reports/expenses?status=unpaid',
                        breakdown: {
                            expenses: unpaidExpenseTotal,
                            vendorLoans: vendorLoans
                        }
                    },
                    unearnedRevenue: { value: totalUnearnedRevenue, drillType: 'project', drillLink: '/reports/project-reports?status=active' },
                },
                longTerm: {
                    loans: { value: 0, drillType: 'loan', drillLink: '/reports/debts' }
                },
                total: totalLiabilities
            },
            equity: {
                capital: { value: capital, drillType: 'capital', drillLink: '/reports/capital' },
                retainedEarnings: { value: retainedEarnings, drillType: 'profit', drillLink: '/reports/project-reports?status=completed' },
                total: totalEquity
            },
            netProfitPeriod: netProfit
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("BalanceSheet_Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
