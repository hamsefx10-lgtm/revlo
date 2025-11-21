import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const sessionUser = await getSessionCompanyUser();
    if (!sessionUser || !sessionUser.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { companyId } = sessionUser;
    
    // Get date from query parameter, default to today
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    let selectedDate: Date;
    
    if (dateParam) {
      selectedDate = new Date(dateParam);
      if (isNaN(selectedDate.getTime())) {
        // Invalid date, use today
        selectedDate = new Date();
      }
    } else {
      selectedDate = new Date();
    }
    
    // Set to start of selected date
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    
    // For previous balance, get balance at end of previous day
    const previousDay = new Date(selectedDate);
    previousDay.setDate(selectedDate.getDate() - 1);
    previousDay.setHours(23, 59, 59, 999);

    // Debts collected on selected date from projects
    const debtsTx = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: { gte: selectedDate, lt: nextDay },
        type: 'DEBT_REPAID',
        projectId: { not: null },
      },
      include: {
        project: { select: { name: true } },
      },
    });
    const debtsCollected = debtsTx.map((tx: any) => ({
      project: tx.project?.name || String(tx.projectId) || 'Unknown',
      amount: Number(tx.amount),
    }));

    // Expenses for selected date only
      const expenses = await prisma.expense.findMany({
        where: {
          companyId,
          expenseDate: { gte: selectedDate, lt: nextDay },
        },
        orderBy: { expenseDate: 'desc' },
        include: {
          project: { select: { name: true } },
          expenseCategory: { select: { name: true } },
        },
      });

      // Split expenses into project and company
  const projectExpenses = expenses.filter((exp: any) => exp.projectId !== null);
  const companyExpenses = expenses.filter((exp: any) => exp.projectId === null);

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
  const totalProjectExpenses = mappedProjectExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
  const totalCompanyExpenses = mappedCompanyExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
      const totalExpenses = totalProjectExpenses + totalCompanyExpenses;

    // Income for selected date only
    const incomeTx = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: { gte: selectedDate, lt: nextDay },
        type: 'INCOME',
      },
      orderBy: { transactionDate: 'desc' },
    });
  const income = incomeTx.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    // Fetch live account balances for the company
    const accounts = await prisma.account.findMany({
      where: { companyId },
      select: { id: true, name: true, balance: true },
    });

    // Calculate balances for selected date
    // Previous balance = balance at end of previous day
    // Today balance = balance at end of selected date
    let balances: { previous: Record<string, number>; today: Record<string, number> } | null = null;
    let totalPrev: number | null = null;
    let totalToday: number | null = null;
    
    if (accounts.length > 0) {
      balances = {
        previous: {},
        today: {},
      };
      
      // Fetch all transactions up to end of selected date for all accounts at once (more efficient)
      const accountIds = accounts.map(acc => acc.id);
      const endOfSelectedDate = new Date(nextDay.getTime() - 1);
      
      const allTransactions = await prisma.transaction.findMany({
        where: {
          companyId,
          accountId: { in: accountIds },
          transactionDate: { lte: endOfSelectedDate },
        },
        select: {
          accountId: true,
          amount: true,
          type: true,
          transactionDate: true,
        },
      });
      
      // Calculate balances for each account
      for (const acc of accounts) {
        // Filter transactions for this account
        const accountTransactions = allTransactions.filter(tx => tx.accountId === acc.id);
        
        // Previous balance: transactions up to end of previous day
        const prevTransactions = accountTransactions.filter(tx => tx.transactionDate <= previousDay);
        const prevBalance = prevTransactions.reduce((sum: number, tx: any) => {
          if (tx.type === 'INCOME' || tx.type === 'TRANSFER_IN') {
            return sum + Number(tx.amount);
          } else if (tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT') {
            return sum - Number(tx.amount);
          }
          return sum;
        }, 0);
        
        // Today balance: all transactions up to end of selected date
        const todayBalance = accountTransactions.reduce((sum: number, tx: any) => {
          if (tx.type === 'INCOME' || tx.type === 'TRANSFER_IN') {
            return sum + Number(tx.amount);
          } else if (tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT') {
            return sum - Number(tx.amount);
          }
          return sum;
        }, 0);
        
        balances.previous[acc.name] = prevBalance;
        balances.today[acc.name] = todayBalance;
      }
      
      totalPrev = Object.values(balances.previous).reduce((sum: number, val: number) => sum + val, 0);
      totalToday = Object.values(balances.today).reduce((sum: number, val: number) => sum + val, 0);
    }

    return NextResponse.json({
      date: selectedDate.toISOString().slice(0, 10),
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
