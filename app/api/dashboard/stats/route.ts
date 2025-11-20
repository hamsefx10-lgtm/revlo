

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Get companyId from session (fallbacks can be added if needed)
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json(
        { message: 'Awood uma lihid. Fadlan soo gal.' },
        { status: 401 }
      );
    }
    const { companyId } = sessionData;

    // Financial stats filtered by companyId - Using same calculation as reports overview
    // Money In (Lacagta Soo Galaysa) - All money received
    const [incomeAgg, expensesAgg, projectsAgg, bankAgg, mobileAgg, cashAgg, lowStockAgg, overdueAgg, completedAgg, activeAgg] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { companyId, type: { in: ['INCOME', 'TRANSFER_IN', 'DEBT_REPAID'] } } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { companyId, type: { in: ['EXPENSE', 'TRANSFER_OUT', 'DEBT_TAKEN'] }, category: { not: 'FIXED_ASSET_PURCHASE' } } }),
      prisma.project.count({ where: { companyId } }),
      prisma.account.aggregate({ _sum: { balance: true }, where: { type: 'BANK', companyId } }),
      prisma.account.aggregate({ _sum: { balance: true }, where: { type: 'MOBILE_MONEY', companyId } }),
      prisma.account.aggregate({ _sum: { balance: true }, where: { type: 'CASH', companyId } }),
      prisma.inventoryItem.count({ where: { inStock: { lt: 5 }, companyId } }),
      prisma.project.count({ where: { status: 'Overdue', companyId } }),
      prisma.project.aggregate({ _sum: { agreementAmount: true }, where: { status: 'Completed', companyId } }),
      prisma.project.aggregate({ _sum: { agreementAmount: true }, where: { status: 'Active', companyId } }),
    ]);

    // Get all expenses from Expense table (more accurate)
    const allExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { companyId },
    });

    // Get payments through projects (Money In from Payments)
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

    // Money In calculation
    const moneyInFromTransactions = incomeAgg._sum.amount ? Number(incomeAgg._sum.amount) : 0;
    const moneyInFromPayments = paymentsReceived._sum.amount ? Number(paymentsReceived._sum.amount) : 0;
    const totalMoneyIn = moneyInFromTransactions + moneyInFromPayments;

    // Money Out calculation - Use Expense table (more accurate than transactions)
    const totalMoneyOut = allExpenses._sum.amount ? Number(allExpenses._sum.amount) : 0;

    // Profit (Faa'iidada Dhabta Ah) = Money In - Money Out
    const realizedProfit = totalMoneyIn - totalMoneyOut;

    // Monthly financial data (filtered by companyId)
    const monthlyFinancialData = await prisma.$queryRaw`SELECT to_char("transactionDate", 'Mon YYYY') as month, SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as expenses, SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as profit FROM "transactions" WHERE "companyId" = ${companyId} GROUP BY month ORDER BY min("transactionDate") DESC LIMIT 12`;

    // Project status breakdown (filtered by companyId)
    const statusColors = {
      Active: '#2ECC71',
      Completed: '#3498DB',
      OnHold: '#F39C12',
      Overdue: '#E74C3C',
      Upcoming: '#9B59B6',
    };
    const statusCounts = await prisma.project.groupBy({
      by: ['status'],
      where: { companyId },
      _count: { status: true },
    });
    const projectStatusBreakdown = statusCounts.map((s: any) => ({
      name: s.status,
      value: s._count.status,
      color: statusColors[s.status as keyof typeof statusColors] || '#A0A0A0',
    }));

    // Recent activities (filtered by companyId)
    const recentActivitiesRaw = await prisma.notification.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
      take: 10,
    });
    const recentActivities = recentActivitiesRaw.map((a: any) => ({
      id: a.id,
      type: a.type,
      description: a.message, // Use 'message' field from notification
      amount: undefined,
      date: a.date instanceof Date ? a.date.toISOString() : a.date,
      user: a.userDisplayName || 'System',
    }));

    // Account breakdown by individual accounts
    const accounts = await prisma.account.findMany({
      where: { companyId },
      select: { id: true, name: true, type: true, balance: true },
      orderBy: { balance: 'desc' },
    });
    const accountBreakdown = accounts.map((acc: any) => ({
      name: acc.name,
      value: Number(acc.balance) || 0,
      type: acc.type,
    }));

    // Debt summary (outstanding debts we owe, receivables owed to us)
    const debtTaken = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { companyId, type: 'DEBT_TAKEN' },
    });
    const debtRepaid = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { companyId, type: 'DEBT_REPAID' },
    });
    const outstandingDebts = Math.abs(Number(debtTaken._sum.amount) || 0) - Math.abs(Number(debtRepaid._sum.amount) || 0);

    // Monthly comparison (this month vs last month)
    const today = new Date();
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    const thisMonthIncome = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        companyId, 
        type: { in: ['INCOME', 'TRANSFER_IN', 'DEBT_REPAID'] },
        transactionDate: { gte: startOfThisMonth },
      },
    });
    const thisMonthExpenses = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        companyId, 
        type: { in: ['EXPENSE', 'TRANSFER_OUT', 'DEBT_TAKEN'] },
        category: { not: 'FIXED_ASSET_PURCHASE' },
        transactionDate: { gte: startOfThisMonth },
      },
    });
    const lastMonthIncome = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        companyId, 
        type: { in: ['INCOME', 'TRANSFER_IN', 'DEBT_REPAID'] },
        transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });
    const lastMonthExpenses = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { 
        companyId, 
        type: { in: ['EXPENSE', 'TRANSFER_OUT', 'DEBT_TAKEN'] },
        category: { not: 'FIXED_ASSET_PURCHASE' },
        transactionDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    });

    // Top expense categories
    const topExpenseCategories = await prisma.expense.groupBy({
      by: ['category'],
      where: { companyId },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    // Fixed assets summary
    const fixedAssets = await prisma.fixedAsset.aggregate({
      _sum: { value: true },
      _count: { id: true },
      where: { companyId },
    });

    return NextResponse.json({
      totalIncome: totalMoneyIn, // Money In (Lacagta Soo Galaysa)
      totalExpenses: totalMoneyOut, // Money Out (Lacagta Baxaysa)
      netProfit: realizedProfit, // Faa'iidada Dhabta Ah = Money In - Money Out
      totalProjects: projectsAgg,
      activeProjects: statusCounts.find((s: any) => s.status === 'Active')?._count.status || 0,
      completedProjects: statusCounts.find((s: any) => s.status === 'Completed')?._count.status || 0,
      onHoldProjects: statusCounts.find((s: any) => s.status === 'OnHold')?._count.status || 0,
      totalBankBalance: Number(bankAgg._sum.balance) || 0,
      totalMobileMoneyBalance: Number(mobileAgg._sum.balance) || 0,
      totalCashBalance: Number(cashAgg._sum.balance) || 0,
      lowStockItems: lowStockAgg,
      overdueProjects: overdueAgg,
      realizedProfitFromCompletedProjects: realizedProfit, // Use calculated profit (same as netProfit)
      potentialProfitFromActiveProjects: Number(activeAgg._sum.agreementAmount) || 0,
      monthlyFinancialData,
      projectStatusBreakdown,
      recentActivities,
      // New data
      accountBreakdown,
      outstandingDebts,
      thisMonthIncome: Math.abs(Number(thisMonthIncome._sum.amount) || 0),
      thisMonthExpenses: Math.abs(Number(thisMonthExpenses._sum.amount) || 0),
      lastMonthIncome: Math.abs(Number(lastMonthIncome._sum.amount) || 0),
      lastMonthExpenses: Math.abs(Number(lastMonthExpenses._sum.amount) || 0),
      topExpenseCategories: topExpenseCategories.map((cat: any) => ({
        name: cat.category || 'Unknown',
        amount: Number(cat._sum.amount) || 0,
      })),
      fixedAssetsValue: Number(fixedAssets._sum.value) || 0,
      fixedAssetsCount: fixedAssets._count.id || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Dashboard stats fetch failed', details: String(err) }, { status: 500 });
  }
}
