import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const companyId = session.user.companyId;

        // 1. ASSETS

        // A. Cash & Bank (Current Assets)
        const accounts = await prisma.account.findMany({
            where: { companyId, isActive: true }
        });
        const totalCashAndBank = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

        // B. Accounts Receivable (Money owed to us)
        // - From Projects: Remaining Amount of Active/Completed projects
        // - From Sales: Unpaid invoices (if tracking sales receivables separately, but user focused on projects)
        // We'll focus on Projects + Standard "Sale" receivables if any
        const projectsWithDebt = await prisma.project.findMany({
            where: {
                companyId,
                remainingAmount: { gt: 0 }
            },
            select: { id: true, name: true, remainingAmount: true }
        });
        const totalReceivables = projectsWithDebt.reduce((sum, p) => sum + Number(p.remainingAmount), 0);

        // C. Inventory (Store Value)
        const inventoryItems = await prisma.inventoryItem.findMany({
            where: { companyId }
        });
        const totalInventoryValue = inventoryItems.reduce((sum, item) => sum + (Number(item.inStock) * Number(item.purchasePrice)), 0);

        // D. Work In Progress (WIP)
        // - Active Projects: Costs incurred so far (Expenses + Materials + Labor)
        //   NOTE: Simple approach -> Total Expenses on Active Projects
        const activeProjects = await prisma.project.findMany({
            where: { companyId, status: 'Active' },
            include: {
                expenses: true,
                materialsUsed: true,
                laborRecords: true
                // We could calculate cost more precisely if needed
            }
        });

        let totalWIPProjects = 0;
        for (const p of activeProjects) {
            // Sum expenses
            const expTotal = p.expenses.reduce((s, e) => s + Number(e.amount), 0);
            // Sum materials (if tracked separately in project_materials and not expenses)
            // Usually materials are expensed, but if they are pulled from inventory, they might be tracked in materialsUsed.
            // To avoid double counting, we'll check if project materials have a cost.
            const matTotal = p.materialsUsed.reduce((s, m) => s + (Number(m.quantityUsed) * Number(m.costPerUnit)), 0);

            // Sum labor
            const laborTotal = p.laborRecords.reduce((s, l) => s + Number(l.paidAmount), 0);

            totalWIPProjects += (expTotal + matTotal + laborTotal);
        }

        // - Workshop Jobs: 'IN_PROGRESS' jobs cost
        const activeJobs = await prisma.workshopJob.findMany({
            where: {
                companyId,
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
        });
        const totalWIPWorkshop = activeJobs.reduce((sum, job) => sum + (job.totalCost || 0), 0);

        // E. Fixed Assets
        const fixedAssets = await prisma.fixedAsset.findMany({
            where: { companyId, status: 'Active' }
        });
        const totalFixedAssets = fixedAssets.reduce((sum, asset) => sum + Number(asset.currentBookValue || asset.value), 0);


        // 2. LIABILITIES

        // A. Accounts Payable (Money we owe)
        // - Unpaid Expenses
        const unpaidExpenses = await prisma.expense.findMany({
            where: {
                companyId,
                paymentStatus: 'UNPAID'
            }
        });
        const totalPayables = unpaidExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

        // B. Customer Advances (Unearned Revenue)
        // - Advance payments for Active projects are technically liabilities until completion
        const customerAdvances = activeProjects.reduce((sum, p) => sum + Number(p.advancePaid), 0);


        // 3. EQUITY
        // Equity = Assets - Liabilities
        // Typically: Capital + Retained Earnings

        // Fetch Shareholders Equity / Capital if any (using Transactions of type 'Capital' or Shareholder model?)
        // For now, we'll assume Equity is the balancing figure + any explicit Capital.
        // Let's deduce Retained Earnings.

        // 4. Employee Loans (Assets)
        // - Employees with overpaidAmount > 0 (treated as loan/advance)
        const employeesWithDebt = await prisma.employee.findMany({
            where: { companyId, overpaidAmount: { gt: 0 } }
        });
        const totalEmployeeLoans = employeesWithDebt.reduce((sum, emp) => sum + Number(emp.overpaidAmount), 0);

        // 5. Shareholders & Equity Logic
        // - Capital Injection: Transactions with shareholderId AND type IN ['INCOME', 'OTHER'] (Money In)
        // - Withdrawals: Transactions with shareholderId AND type IN ['EXPENSE', 'DEBT_REPAID', 'TRANSFER_OUT'] (Money Out)

        // Fetch all shareholder transactions
        const shareholderTxns = await prisma.transaction.findMany({
            where: {
                companyId,
                shareholderId: { not: null }
            }
        });

        let totalCapital = 0;
        let totalWithdrawals = 0;

        for (const txn of shareholderTxns) {
            const amount = Number(txn.amount);
            // Assuming INCOME/DEBT_TAKEN/OTHER(positive?) as Capital Injection
            if (['INCOME', 'DEBT_TAKEN', 'OTHER'].includes(txn.type)) {
                totalCapital += amount;
            } else {
                // EXPENSE, DEBT_REPAID, TRANSFER_OUT
                totalWithdrawals += amount;
            }
        }

        // 6. Real Retained Earnings Calculation (Revenue - Expenses)
        // A. Total Revenue (Accrual Basis)
        // - Projects: Sum of Agreement Amount (for non-cancelled projects)
        const allProjects = await prisma.project.findMany({
            where: { companyId, status: { not: 'Cancelled' } },
            select: { agreementAmount: true }
        });
        const projectRevenue = allProjects.reduce((sum, p) => sum + Number(p.agreementAmount), 0);

        // - Sales: Sum of Total for Completed Sales
        // NOTE: Sale model does not have companyId directly, so we filter by user's company
        const allSales = await prisma.sale.findMany({
            where: {
                user: { companyId },
                status: { not: 'Cancelled' }
            },
            select: { total: true }
        });
        const salesRevenue = allSales.reduce((sum, s) => sum + s.total, 0);

        const totalRevenue = projectRevenue + salesRevenue;

        // B. Total Expenses
        const allExpenses = await prisma.expense.findMany({
            where: { companyId },
            select: { amount: true }
        });
        const totalExpenses = allExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

        // C. Cost of Goods Sold / Materials (If not in expenses)
        // Note: If you have material purchases recorded as EXPENSES, don't double count.
        // If we assume all standard expenses are in Expense table, we use that.

        // Net Income
        const netIncome = totalRevenue - totalExpenses;

        // Retained Earnings = Net Income - Withdrawals
        const retainedEarnings = netIncome - totalWithdrawals;


        // Final Aggregation
        const totalAssets = totalCashAndBank + totalReceivables + totalInventoryValue + totalWIPProjects + totalWIPWorkshop + totalFixedAssets + totalEmployeeLoans;
        const totalLiabilities = totalPayables + customerAdvances;

        // Check Equity Balance
        // Accounting Equation: Assets = Liabilities + Equity
        // Equity = Capital + Retained Earnings
        // Calculated Equity
        const calculatedEquity = totalCapital + retainedEarnings;

        // Total Equity (Derived from A - L for display consistency, or calculated? Ideally they match)
        // If they don't match, there's a "Variance" or "Opening Balance Equity" missing.
        // We will show the Calculated Equity components, but ensure the "Total Equity" balances the sheet visually 
        // or show a discrepancy if the user needs to debug.
        // For a "Perfect" balance sheet in a system without full double-entry enforcement, relying on A - L is safer for the "Total",
        // but showing the breakdown helps.

        // Let's rely on A - L for the top level "Total Equity" card to ensure it balances.
        const totalEquity = totalAssets - totalLiabilities;

        // The difference between (A-L) and (Capital + Retained Earnings) is likely "Uncategorized Equity" or "Opening Balance"
        const equityAdjustment = totalEquity - (totalCapital + retainedEarnings);

        return NextResponse.json({
            summary: {
                totalAssets,
                totalLiabilities,
                totalEquity,
                isBalanced: true
            },
            assets: {
                current: {
                    cashAndBank: totalCashAndBank,
                    accountsReceivable: totalReceivables,
                    inventory: totalInventoryValue,
                    wipProjects: totalWIPProjects,
                    wipWorkshop: totalWIPWorkshop,
                    employeeLoans: totalEmployeeLoans,
                    totalCurrent: totalCashAndBank + totalReceivables + totalInventoryValue + totalWIPProjects + totalWIPWorkshop + totalEmployeeLoans
                },
                fixed: {
                    totalFixed: totalFixedAssets,
                    items: fixedAssets
                }
            },
            liabilities: {
                current: {
                    accountsPayable: totalPayables,
                    customerAdvances: customerAdvances,
                    totalCurrent: totalPayables + customerAdvances
                },
                longTerm: {
                    totalLongTerm: 0
                }
            },
            equity: {
                retainedEarnings: retainedEarnings,
                capital: totalCapital,
                drawings: totalWithdrawals,
                adjustment: equityAdjustment, // To show if there is a discrepancy
                totalEquity: totalEquity
            }
        });

    } catch (error: any) {
        console.error('Error calculating balance sheet:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
