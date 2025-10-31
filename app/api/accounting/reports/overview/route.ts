// app/api/accounting/reports/overview/route.ts - Overview API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '../auth';

// GET /api/accounting/reports/overview - Overview stats for dashboard
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    // Total Income, Expenses, Net Profit
    const incomeResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { companyId, type: { in: ['INCOME', 'TRANSFER_IN', 'DEBT_REPAID'] } },
    });
    const expenseResult = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { companyId, type: { in: ['EXPENSE', 'TRANSFER_OUT', 'DEBT_TAKEN'] }, category: { not: 'FIXED_ASSET_PURCHASE' } },
    });
    const totalIncome = incomeResult._sum.amount ? Number(incomeResult._sum.amount) : 0;
    const totalExpenses = expenseResult._sum.amount ? Number(expenseResult._sum.amount) : 0;
    const netProfit = totalIncome - totalExpenses;

    // Projects
    const totalProjects = await prisma.project.count({ where: { companyId } });
    const activeProjects = await prisma.project.count({ where: { companyId, status: 'Active' } });
    const completedProjects = await prisma.project.count({ where: { companyId, status: 'Completed' } });
    const onHoldProjects = await prisma.project.count({ where: { companyId, status: 'On Hold' } });

    // Expenses breakdown
    const companyExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { companyId, projectId: null },
    });
    const projectExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { companyId, projectId: { not: null } },
    });

    // Outstanding Debts: Amount we owe to vendors (DEBT_TAKEN transactions)
    const outstandingDebts = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { companyId, type: 'DEBT_TAKEN' },
    });
    
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
        totalIncome,
        totalExpenses,
        netProfit,
        totalProjects,
        activeProjects,
        completedProjects,
        onHoldProjects,
        companyExpenses: companyExpenses._sum.amount ? Number(companyExpenses._sum.amount) : 0,
        projectExpenses: projectExpenses._sum.amount ? Number(projectExpenses._sum.amount) : 0,
        outstandingDebts: outstandingDebts._sum.amount ? Number(outstandingDebts._sum.amount) : 0,
        receivableDebts: receivableDebtsAmount,
        fixedAssetsValue: fixedAssets._sum.value ? Number(fixedAssets._sum.value) : 0,
        totalBankBalance: totalBankBalance._sum.balance ? Number(totalBankBalance._sum.balance) : 0,
        totalCashBalance: totalCashBalance._sum.balance ? Number(totalCashBalance._sum.balance) : 0,
        shareholdersEquity: netProfit + receivableDebtsAmount - (outstandingDebts._sum.amount ? Number(outstandingDebts._sum.amount) : 0)
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Overview API error:', error);
    return NextResponse.json({ message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' }, { status: 500 });
  }
}
