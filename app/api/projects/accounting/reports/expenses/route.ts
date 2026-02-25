// app/api/accounting/reports/expenses/route.ts - Expenses Report API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/accounting/reports/expenses - Soo deji xogta warbixinta kharashyada
export async function GET(request: Request) {
  try {
    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isManagerOrAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // Parameters for date range and filters
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const categoryFilter = searchParams.get('category');
    const projectFilter = searchParams.get('project');
    const paidFromFilter = searchParams.get('paidFrom');

    const startDate = startDateParam ? new Date(startDateParam) : undefined;
    const endDate = endDateParam ? new Date(endDateParam) : undefined;

    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
        category: categoryFilter || undefined,
        projectId: projectFilter || undefined,
        paidFrom: paidFromFilter || undefined,
        // companyId: companyId // Mustaqbalka, ku dar filter-kan
      },
      include: {
          project: { select: { name: true } },
          user: { select: { fullName: true } },
      },
      orderBy: {
        expenseDate: 'desc',
      },
    });

    // Calculate aggregated data for the report
    let totalExpensesAmount = 0;
    let projectExpensesAmount = 0;
    let companyExpensesAmount = 0;
    const expenseCategoryBreakdown: { [key: string]: number } = {};
    const monthlyExpensesTrend: { [key: string]: { month: string; total: number } } = {};

    expenses.forEach((exp: any) => {
      const amount = (typeof exp.amount === 'object' && 'toNumber' in exp.amount) ? exp.amount.toNumber() : Number(exp.amount);
      totalExpensesAmount += amount;

      if (exp.projectId) { // Assuming project expenses have projectId
        projectExpensesAmount += amount;
      } else { // Assuming non-project expenses are company expenses
        companyExpensesAmount += amount;
      }

      // Category breakdown
      const key = exp.category || 'Other';
      expenseCategoryBreakdown[key] = (expenseCategoryBreakdown[key] || 0) + amount;

      // Monthly trend
      const monthYear = exp.expenseDate instanceof Date ? exp.expenseDate.toLocaleString('en-US', { month: 'short', year: 'numeric' }) : new Date(exp.expenseDate).toLocaleString('en-US', { month: 'short', year: 'numeric' });
      if (!monthlyExpensesTrend[monthYear]) {
        monthlyExpensesTrend[monthYear] = { month: monthYear, total: 0 };
      }
      monthlyExpensesTrend[monthYear].total += amount;
    });

    const averageExpense = expenses.length > 0 ? totalExpensesAmount / expenses.length : 0;

    const sortedMonthlyExpenses = Object.values(monthlyExpensesTrend).sort((a, b) => {
        const [monthA, yearA] = a.month.split(' ');
        const [monthB, yearB] = b.month.split(' ');
        const dateA = new Date(`1 ${monthA} 20${yearA}`);
        const dateB = new Date(`1 ${monthB} 20${yearB}`);
        return dateA.getTime() - dateB.getTime();
    });

    const categoryBreakdownData = Object.keys(expenseCategoryBreakdown).map((key: string) => ({
        name: key,
        value: expenseCategoryBreakdown[key],
    }));


    return NextResponse.json(
      {
        totalExpensesAmount: totalExpensesAmount,
        projectExpensesAmount: projectExpensesAmount,
        companyExpensesAmount: companyExpensesAmount,
        averageExpense: averageExpense,
        expenseCategoryBreakdown: categoryBreakdownData,
        monthlyExpensesTrend: sortedMonthlyExpenses,
        expenses: expenses.map((exp: any) => ({ // Return original expenses with converted amount
            ...exp,
            amount: (typeof exp.amount === 'object' && 'toNumber' in exp.amount) ? exp.amount.toNumber() : Number(exp.amount),
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka warbixinta kharashyada la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
