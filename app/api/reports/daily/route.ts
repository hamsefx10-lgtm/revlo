import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Debts collected today from projects
    const debtsTx = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: { gte: yesterday, lte: now },
        type: 'DEBT_REPAID',
        projectId: { not: null },
      },
      include: {
        project: { select: { name: true } },
      },
    });
    const debtsCollected = debtsTx.map(tx => ({
      project: tx.project?.name || String(tx.projectId) || 'Unknown',
      amount: Number(tx.amount),
    }));

    // Expenses for last 24 hours
      const expenses = await prisma.expense.findMany({
        where: {
          companyId,
          expenseDate: { gte: yesterday, lte: now },
        },
        orderBy: { expenseDate: 'desc' },
        include: {
          project: { select: { name: true } },
          expenseCategory: { select: { name: true } },
        },
      });

      // Split expenses into project and company
      const projectExpenses = expenses.filter(exp => exp.projectId !== null);
      const companyExpenses = expenses.filter(exp => exp.projectId === null);

      // Map for frontend
      const mapExpense = (exp: any) => ({
        date: exp.expenseDate?.toISOString().slice(0, 10) || '',
        project: exp.project?.name || String(exp.projectId) || 'Internal',
        category: exp.expenseCategory?.name || exp.category || '',
        description: exp.description || '',
        amount: Number(exp.amount),
      });
      const mappedProjectExpenses = projectExpenses.map(mapExpense);
      const mappedCompanyExpenses = companyExpenses.map(mapExpense);
      const totalProjectExpenses = mappedProjectExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalCompanyExpenses = mappedCompanyExpenses.reduce((sum, e) => sum + e.amount, 0);
      const totalExpenses = totalProjectExpenses + totalCompanyExpenses;

    // Income for last 24 hours (assume income is positive transactions)
    const incomeTx = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: { gte: yesterday, lte: now },
        type: 'INCOME',
      },
      orderBy: { transactionDate: 'desc' },
    });
    const income = incomeTx.reduce((sum, tx) => sum + Number(tx.amount), 0);

    // Fetch live account balances for the company
    const accounts = await prisma.account.findMany({
      where: { companyId },
      select: { name: true, balance: true },
    });

    // Only show balances if accounts exist
    let balances: { previous: Record<string, number>; today: Record<string, number> } | null = null;
    let totalPrev: number | null = null;
    let totalToday: number | null = null;
    if (accounts.length > 0) {
      // For demo, use the same balance for previous/today (can be improved with transaction history)
      balances = {
        previous: {},
        today: {},
      };
      accounts.forEach(acc => {
        if (balances) {
          const balanceValue = Number(acc.balance);
          balances.previous[acc.name] = balanceValue;
          balances.today[acc.name] = balanceValue;
        }
      });
      totalPrev = accounts.reduce((sum, acc) => {
        return sum + Number(acc.balance);
      }, 0);
      totalToday = totalPrev;
    }

    return NextResponse.json({
      date: now.toISOString().slice(0, 10),
      balances: balances || { previous: {}, today: {} },
      totalPrev: totalPrev ?? 0,
      totalToday: totalToday ?? 0,
      income: income ?? 0,
      projectExpenses: mappedProjectExpenses || [],
      companyExpenses: mappedCompanyExpenses || [],
      totalProjectExpenses: totalProjectExpenses ?? 0,
      totalCompanyExpenses: totalCompanyExpenses ?? 0,
      totalExpenses: totalExpenses ?? 0,
      debtsCollected,
    }, { status: 200 });
  } catch (error) {
    console.error('Daily Report API error:', error);
    return NextResponse.json({ message: 'Cilad server ayaa dhacday.' }, { status: 500 });
  }
}
