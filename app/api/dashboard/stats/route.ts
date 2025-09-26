

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    // Get companyId from session (fallbacks can be added if needed)
    const { companyId } = await getSessionCompanyUser();

    // Financial stats filtered by companyId
    const [incomeAgg, expensesAgg, projectsAgg, bankAgg, mobileAgg, cashAgg, lowStockAgg, overdueAgg, completedAgg, activeAgg] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'INCOME', companyId } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'EXPENSE', companyId } }),
      prisma.project.count({ where: { companyId } }),
      prisma.account.aggregate({ _sum: { balance: true }, where: { type: 'BANK', companyId } }),
      prisma.account.aggregate({ _sum: { balance: true }, where: { type: 'MOBILE_MONEY', companyId } }),
      prisma.account.aggregate({ _sum: { balance: true }, where: { type: 'CASH', companyId } }),
      prisma.inventoryItem.count({ where: { inStock: { lt: 5 }, companyId } }),
      prisma.project.count({ where: { status: 'Overdue', companyId } }),
      prisma.project.aggregate({ _sum: { agreementAmount: true }, where: { status: 'Completed', companyId } }),
      prisma.project.aggregate({ _sum: { agreementAmount: true }, where: { status: 'Active', companyId } }),
    ]);

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

    return NextResponse.json({
      totalIncome: Number(incomeAgg._sum.amount) || 0,
      totalExpenses: Number(expensesAgg._sum.amount) || 0,
      netProfit: Number(completedAgg._sum.agreementAmount) || 0, // Only realized profit from completed projects
      totalProjects: projectsAgg,
      activeProjects: statusCounts.find((s: any) => s.status === 'Active')?._count.status || 0,
      completedProjects: statusCounts.find((s: any) => s.status === 'Completed')?._count.status || 0,
      onHoldProjects: statusCounts.find((s: any) => s.status === 'OnHold')?._count.status || 0,
      totalBankBalance: Number(bankAgg._sum.balance) || 0,
      totalMobileMoneyBalance: Number(mobileAgg._sum.balance) || 0,
      totalCashBalance: Number(cashAgg._sum.balance) || 0,
      lowStockItems: lowStockAgg,
      overdueProjects: overdueAgg,
      realizedProfitFromCompletedProjects: Number(completedAgg._sum.agreementAmount) || 0,
      potentialProfitFromActiveProjects: Number(activeAgg._sum.agreementAmount) || 0,
      monthlyFinancialData,
      projectStatusBreakdown,
      recentActivities,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Dashboard stats fetch failed', details: String(err) }, { status: 500 });
  }
}
