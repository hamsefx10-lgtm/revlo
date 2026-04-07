// app/api/projects/accounting/reports/overview/route.ts - Overview API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// GET /api/projects/accounting/reports/overview - Overview stats for dashboard

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;
    if (!companyId) {
      return NextResponse.json({ message: 'Company ID not found in session.' }, { status: 401 });
    }
    // Total Income, Expenses, Net Profit
    const incomeResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        OR: [
          { type: 'INCOME' },
          { type: 'TRANSFER_IN' },
          { type: 'DEBT_REPAID', vendorId: null }
        ]
      },
    });
    const expenseResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        OR: [
          { type: 'EXPENSE' },
          { type: 'TRANSFER_OUT' },
          { type: 'DEBT_TAKEN' },
          { type: 'DEBT_REPAID', vendorId: { not: null } }
        ],
        category: { not: 'FIXED_ASSET_PURCHASE' }
      },
    });
    // Money In (Lacagta Soo Galaysa) - All money received
    // This includes: INCOME transactions, TRANSFER_IN, DEBT_REPAID (when customer repays us), and all Payments
    // Get payments through projects (Payment table)
    const projects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true },
    });
    const projectIds = projects.map(p => p.id);

    const paymentsReceived = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        projectId: { in: projectIds }
      },
    });

    // Money In from transactions (INCOME, DEBT_REPAID when customer repays, TRANSFER_IN)
    const moneyInFromTransactions = incomeResult._sum.amount ? Number(incomeResult._sum.amount) : 0;
    // Money In from payments (direct payments to projects/customers)
    const moneyInFromPayments = paymentsReceived._sum.amount ? Number(paymentsReceived._sum.amount) : 0;
    // Total Money In = Transactions (INCOME, DEBT_REPAID, TRANSFER_IN) + Direct Payments
    const totalMoneyIn = moneyInFromTransactions + moneyInFromPayments;

    // Money Out (Lacagta Baxaysa) - All money spent from Expense table
    // This includes all expenses regardless of project or company
    const allExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        category: { not: 'FIXED_ASSET_PURCHASE' }
      },
    });

    // Total Money Out = All expenses from Expense table (most accurate)
    const totalMoneyOut = allExpenses._sum.amount ? Number(allExpenses._sum.amount) : 0;

    // Profit (Faa'iidada) = Money In - Money Out (Simple Cash Flow Accounting)
    // Lacagta soo galaysa - Lacagta baxaysa = Faa'iidada
    const netProfit = totalMoneyIn - totalMoneyOut;

    // Legacy fields for compatibility
    const totalIncome = totalMoneyIn;
    const totalExpenses = totalMoneyOut;

    // Projects count
    const totalProjects = await prisma.project.count({ where: { companyId } });
    const activeProjects = await prisma.project.count({ where: { companyId, status: 'Active' } });
    const completedProjectsCount = await prisma.project.count({ where: { companyId, status: 'Completed' } });
    const onHoldProjects = await prisma.project.count({ where: { companyId, status: 'On Hold' } });

    // Expenses breakdown - For display purposes
    const companyExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        projectId: null,
        category: { not: 'FIXED_ASSET_PURCHASE' }
      },
    });
    const projectExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        companyId,
        projectId: { not: null },
        category: { not: 'FIXED_ASSET_PURCHASE' }
      },
    });

    const totalDebtTaken = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { companyId, type: 'DEBT_TAKEN' },
    });
    const totalVendorDebtRepaid = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { companyId, type: 'DEBT_REPAID', vendorId: { not: null } },
    });

    const outstandingDebtsAmount = Math.abs(Number(totalDebtTaken._sum.amount || 0)) - Math.abs(Number(totalVendorDebtRepaid._sum.amount || 0));

    // Receivable Debts: Amount customers owe us
    // This includes project agreements where advance payment is less than total amount
    const projectsWithDebts = await prisma.project.findMany({
      where: { companyId },
      select: { agreementAmount: true, advancePaid: true }
    });

    const receivableDebtsAmount = projectsWithDebts.reduce((total, project) => {
      const remaining = Number(project.agreementAmount || 0) - Number(project.advancePaid || 0);
      return total + (remaining > 0 ? remaining : 0);
    }, 0);

    // Fixed Assets
    const fixedAssets = await prisma.fixedAsset.aggregate({
      _sum: { value: true },
      where: { companyId },
    });

    // Bank & Cash


    const totalBankBalance = await prisma.account.aggregate({
      _sum: { balance: true },
      where: { companyId, type: 'BANK' },
    });
    const totalCashBalance = await prisma.account.aggregate({
      _sum: { balance: true },
      where: { companyId, type: 'CASH' },
    });



    return NextResponse.json({
      stats: {
        totalIncome: totalMoneyIn, // Money In (Lacagta Soo Galaysa)
        totalExpenses: totalMoneyOut, // Money Out (Lacagta Baxaysa)
        netProfit, // Faa'iidada = Lacagta Soo Galaysa - Lacagta Baxaysa
        totalMoneyIn, // Explicit field for clarity
        totalMoneyOut, // Explicit field for clarity
        moneyInFromTransactions, // Money from transactions
        moneyInFromPayments, // Money from payments
        totalProjects,
        activeProjects,
        completedProjects: completedProjectsCount,
        onHoldProjects,
        companyExpenses: companyExpenses._sum.amount ? Number(companyExpenses._sum.amount) : 0,
        projectExpenses: projectExpenses._sum.amount ? Number(projectExpenses._sum.amount) : 0,
        outstandingDebts: Math.max(0, outstandingDebtsAmount),
        receivableDebts: receivableDebtsAmount,
        fixedAssetsValue: fixedAssets._sum.value ? Number(fixedAssets._sum.value) : 0,
        totalBankBalance: totalBankBalance._sum.balance ? Number(totalBankBalance._sum.balance) : 0,
        totalCashBalance: totalCashBalance._sum.balance ? Number(totalCashBalance._sum.balance) : 0,
        shareholdersEquity: netProfit + receivableDebtsAmount - Math.max(0, outstandingDebtsAmount)
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Overview API error:', error);
    return NextResponse.json({ message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' }, { status: 500 });
  }
}
