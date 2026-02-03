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

        const userId = session.user.id;
        const companyId = session.user.companyId;
        const url = new URL(req.url);

        // PARAMS
        const projectId = url.searchParams.get('projectId');
        const dateParam = url.searchParams.get('date');
        const filterDate = dateParam ? new Date(dateParam) : new Date();
        filterDate.setHours(23, 59, 59, 999);

        // FILTERS
        const commonFilter = {
            companyId,
            ...(projectId ? { projectId } : {}),
            createdAt: { lte: filterDate }
        };

        const transactionFilter = {
            companyId,
            ...(projectId ? { projectId } : {}),
            transactionDate: { lte: filterDate }
        };

        // --- 1. ASSETS ---
        let totalCashAndBank = 0;
        let inventoryValue = 0;
        let fixedAssetsValue = 0;
        let ar = 0;

        // A. CASH & BANK (Financial Accounts)
        // If Project: Cash attributed to project? usually projects don't hold cash accounts directly unless "Petty Cash".
        // Strategy: For Projects, we might skip "Cash" or show "Cash Collected" vs "Cash Spent"? 
        // Standard Accounting: A project has no "Cash" asset unless strictly allocated. 
        // We will skip Cash for specific Project Balance Sheet unless explicitly tagged.
        if (!projectId) {
            const accounts = await prisma.account.findMany({ where: { companyId } });
            // For historical balance, we should sum transactions. But for now, using current balance as per previous logic (simplified).
            // TODO: Real historical balance requires calculating backwards from current or summing all from start.
            totalCashAndBank = accounts.reduce((sum, acc) => sum + toNumber(acc.balance), 0);
        }

        let wipValue = 0; // WIP Variable declared in scope

        // C. INVENTORY
        // Inventory (Shop) + WIP (Projects)
        if (!projectId) {
            // 1. Shop Inventory
            const inventoryItems = await prisma.inventoryItem.findMany({
                where: { companyId }
            });
            if (inventoryItems.length > 0) {
                inventoryValue = inventoryItems.reduce((sum, item) => sum + (toNumber(item.inStock) * toNumber(item.purchasePrice)), 0);
            }

            // 2. Work In Progress (WIP) - Active Projects Expenses
            // We treat ALL expenses of Active projects as WIP Asset.
            const activeProjectsExpenses = await prisma.expense.aggregate({
                where: {
                    companyId,
                    project: { status: 'Active' }, // Ensure relation exists or filter manually if needed
                    createdAt: { lte: filterDate }
                },
                _sum: { amount: true }
            });
            wipValue = toNumber(activeProjectsExpenses._sum.amount);

            // We add WIP to Inventory Value for the summary, or we can separate it if the UI supports it.
            // For now, let's keep it in "Inventory" bucket or return a new key if we updated the interface.
            // The prompt "template" showed "Work In Progress" as a separate line item. 
            // We will add it to the 'current' assets object in the response.
            // For the variable `inventoryValue`, we'll keep it strictly Shop Inventory?
            // Let's add a new variable `wipValue`.
            // wipValue is updated in outer scope.
        }

        // C. FIXED ASSETS
        if (!projectId) {
            const assets = await prisma.fixedAsset.findMany({
                where: {
                    companyId,
                    purchaseDate: { lte: filterDate }
                }
            });
            fixedAssetsValue = assets.reduce((sum, fa) => sum + toNumber(fa.currentBookValue), 0);
        }

        // D. ACCOUNTS RECEIVABLE (Unpaid Sales/Invoices)
        // For Project: Unpaid Agreement/Milestones (Only for COMPLETED projects? Or Active too?)
        // In this new "Standard" logic:
        // Active Project: No Revenue recognized, so No AR. Payments are Liability.
        // Completed Project: Revenue recognized. AR = Agreement - Paid.

        if (projectId) {
            // ... (Same logic for specific project view)
            // But actually we might want to apply the same logic if it is Active.
        } else {
            // Shop AR
            const unpaidSales = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate }, paymentStatus: { not: 'Paid' } }
            });
            const shopAr = unpaidSales.reduce((sum, sale) => sum + (toNumber(sale.total) - toNumber(sale.paidAmount)), 0);

            // Completed Projects AR
            const completedProjects = await prisma.project.findMany({
                where: { companyId, status: 'Completed' },
                include: { payments: true } // Need payments to calc AR
            });

            let projectsAr = 0;
            completedProjects.forEach(p => {
                const totalPaid = p.payments.reduce((s, pay) => s + toNumber(pay.amount), 0) + toNumber(p.advancePaid);
                const due = Math.max(0, toNumber(p.agreementAmount) - totalPaid); // Use projectValue or agreementAmount
                projectsAr += due;
            });

            ar = shopAr + projectsAr;
        }

        // --- 2. LIABILITIES ---
        let accountsPayable = 0;
        let taxPayable = 0;
        let longTermLoans = 0;

        // A. ACCOUNTS PAYABLE (Unpaid Expenses/Bills)
        const unpaidExpenses = await prisma.expense.findMany({
            where: {
                ...commonFilter,
                paymentStatus: 'UNPAID'
            }
        });
        accountsPayable = unpaidExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        // B. TAX PAYABLE
        if (!projectId) {
            const allSales = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate } },
                select: { tax: true }
            });
            taxPayable = allSales.reduce((sum, s) => sum + toNumber(s.tax), 0);
        }

        // C. UNEARNED REVENUE (Customer Advances for Active Projects)
        // This is the new Liability for Active Projects.
        let unearnedRevenue = 0;
        if (!projectId) {
            const activeProjects = await prisma.project.findMany({
                where: { companyId, status: 'Active' },
                include: { payments: true }
            });

            activeProjects.forEach(p => {
                const advances = toNumber(p.advancePaid);
                const payments = p.payments.reduce((s, pay) => s + toNumber(pay.amount), 0);
                unearnedRevenue += (advances + payments);
            });
        }

        // C. LOANS
        // Loans are usually company level, unless project specific financing.
        if (!projectId) {
            const debts = await prisma.transaction.findMany({
                where: {
                    ...transactionFilter,
                    type: { in: ['DEBT_TAKEN', 'DEBT_REPAID'] }
                }
            });
            debts.forEach(t => {
                const amt = toNumber(t.amount);
                if (t.type === 'DEBT_TAKEN') longTermLoans += amt;
                if (t.type === 'DEBT_REPAID') longTermLoans -= amt;
            });
        }

        // --- 3. EQUITY ---
        let totalCapital = 0;
        let retainedEarnings = 0;

        // A. CAPITAL
        if (!projectId) {
            const capitalTx = await prisma.transaction.findMany({
                where: {
                    ...transactionFilter,
                    OR: [
                        { shareholderId: { not: null } },
                        { category: { equals: 'Capital', mode: 'insensitive' } }
                    ]
                }
            });
            totalCapital = capitalTx.reduce((sum, t) => {
                if (['INCOME', 'OTHER'].includes(t.type)) return sum + toNumber(t.amount);
                return sum;
            }, 0);
        }

        // B. RETAINED EARNINGS (Net Profit)
        // Revenue
        let revenue = 0;
        if (projectId) {
            // ... (keep simple for specific project filter if needed, or update to standard)
            // If Active, Revenue = 0 (Unearned). If Completed, Revenue = Agreement.
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (project && project.status === 'Completed') {
                revenue = toNumber(project.agreementAmount); // Use projectValue or agreementAmount
            }
        } else {
            // 1. Shop Sales
            const saleData = await prisma.sale.findMany({
                where: { userId, createdAt: { lte: filterDate } },
                select: { subtotal: true }
            });
            const shopRevenue = saleData.reduce((sum, s) => sum + toNumber(s.subtotal), 0);

            // 2. Completed Projects Revenue
            const completedProjects = await prisma.project.findMany({
                where: { companyId, status: 'Completed' }
            });
            const projectsRevenue = completedProjects.reduce((sum, p) => sum + toNumber(p.agreementAmount), 0);

            revenue = shopRevenue + projectsRevenue;
        }

        // Expenses
        // We must exclude Active Project Expenses (WIP) from the P&L Expenses.
        const allExpenses = await prisma.expense.findMany({
            where: {
                ...commonFilter,
                OR: [
                    { projectId: null }, // Company Expenses
                    { project: { status: { not: 'Active' } } } // Completed/Cancelled Project Expenses
                ]
            }
        });
        const totalExps = allExpenses.reduce((sum, e) => sum + toNumber(e.amount), 0);

        // COGS (For Sales - Company Only usually, unless Project has COGS)
        let cogs = 0;
        if (!projectId) {
            const completedSales = await prisma.sale.findMany({
                where: { userId, status: 'Completed', createdAt: { lte: filterDate } },
                include: { items: { include: { product: true } } }
            });
            completedSales.forEach(s => {
                if (s.items && Array.isArray(s.items)) {
                    s.items.forEach(item => {
                        if (item.product) {
                            cogs += (toNumber(item.quantity) * toNumber(item.product.costPrice));
                        }
                    });
                }
            });
        }

        retainedEarnings = revenue - totalExps - cogs;


        // RESPONSE
        // We add "drill" metadata to each line.
        const responseData = {
            assets: {
                current: {
                    cashAndBank: { value: totalCashAndBank, drillType: 'ACCOUNT', drillId: 'all' },
                    accountsReceivable: { value: ar, drillType: 'CUSTOMER', drillId: 'all' },
                    inventory: { value: inventoryValue, drillType: 'INVENTORY', drillId: 'all' },
                    workInProgress: { value: wipValue, drillType: 'PROJECT', drillId: 'active' } // NEW
                },
                fixed: { value: fixedAssetsValue, drillType: 'ASSET', drillId: 'all' },
                total: totalCashAndBank + ar + inventoryValue + fixedAssetsValue + wipValue
            },
            liabilities: {
                current: {
                    accountsPayable: { value: accountsPayable, drillType: 'CATEGORY', drillId: 'Payables' },
                    taxPayable: { value: taxPayable, drillType: 'TAX', drillId: 'all' },
                    unearnedRevenue: { value: unearnedRevenue, drillType: 'PROJECT', drillId: 'active' } // NEW
                },
                longTerm: { value: longTermLoans, drillType: 'ACCOUNT', drillId: 'Loans' },
                total: accountsPayable + taxPayable + longTermLoans + unearnedRevenue
            },
            equity: {
                capital: { value: totalCapital, drillType: 'SHAREHOLDER', drillId: 'all' },
                retainedEarnings: { value: retainedEarnings, drillType: 'PROFIT_LOSS', drillId: 'all' },
                total: totalCapital + retainedEarnings
            }
        };

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error("BS_Critical_Fail:", error);
        return NextResponse.json({
            error: 'Failed to generate balance sheet',
            details: error.message
        }, { status: 500 });
    }
}

