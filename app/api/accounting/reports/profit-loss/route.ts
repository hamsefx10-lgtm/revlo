import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';
import { Decimal } from '@prisma/client/runtime/library';

// GET /api/accounting/reports/profit-loss - Soo deji xogta warbixinta faa'iidada & khasaaraha
export async function GET(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId } = sessionData;

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const dateRange = searchParams.get('dateRange') || 'This Year';

    // Calculate date range based on filter
    let dateFilter: any = {};
    const today = new Date();
    
    switch (dateRange) {
      case 'This Month':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        dateFilter = { gte: startOfMonth, lte: endOfMonth };
        break;
      case 'This Quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(today.getFullYear(), quarter * 3 + 3, 0);
        dateFilter = { gte: startOfQuarter, lte: endOfQuarter };
        break;
      case 'Last 12 Months':
        const last12Months = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        dateFilter = { gte: last12Months, lte: today };
        break;
      case 'This Year':
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        dateFilter = { gte: startOfYear, lte: endOfYear };
        break;
      default:
        if (startDate && endDate) {
          dateFilter = { gte: new Date(startDate), lte: new Date(endDate) };
        }
    }

    // Fetch all transactions for the company
    const allTransactions = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      include: {
        project: { select: { id: true, name: true, status: true } },
        account: { select: { name: true } },
        customer: { select: { name: true } },
        vendor: { select: { name: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    // Fetch all expenses for the company
    const allExpenses = await prisma.expense.findMany({
      where: {
        companyId,
        expenseDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
      },
      include: {
        project: { select: { id: true, name: true, status: true } },
        vendor: { select: { name: true } },
        customer: { select: { name: true } },
        user: { select: { fullName: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    // Separate project income and direct project costs
    const projectIncomeItems = allTransactions
      .filter(trx => trx.type === 'INCOME' && trx.projectId)
      .map(trx => ({
        id: trx.id,
        date: trx.transactionDate.toISOString(),
        description: trx.description,
        amount: Number(trx.amount),
        type: 'Project Income',
        projectId: trx.projectId,
        projectName: trx.project?.name || 'Unknown Project',
      }));

    const directProjectCostItems = allExpenses
      .filter(exp => exp.projectId && ['Material', 'Labor', 'Transport'].includes(exp.category))
      .map(exp => ({
        id: exp.id,
        date: exp.expenseDate.toISOString(),
        description: exp.description,
        amount: Number(exp.amount),
        type: exp.category,
        projectId: exp.projectId,
        projectName: exp.project?.name || 'Unknown Project',
      }));

    // Operating expenses (company expenses + non-project expenses)
    const operatingExpensesItems = [
      ...allExpenses
        .filter(exp => !exp.projectId || ['Company Expense'].includes(exp.category))
        .map(exp => ({
          id: exp.id,
          date: exp.expenseDate.toISOString(),
          description: exp.description,
          amount: Number(exp.amount),
          type: exp.category,
          projectId: exp.projectId,
          projectName: exp.project?.name || 'Company Expense',
        })),
      ...allTransactions
        .filter(trx => trx.type === 'EXPENSE' && !trx.projectId)
        .map(trx => ({
          id: trx.id,
          date: trx.transactionDate.toISOString(),
          description: trx.description,
          amount: Number(trx.amount),
          type: 'Operating Expense',
          projectId: trx.projectId,
          projectName: trx.project?.name || 'Company Expense',
        }))
    ];

    // Group by projects
    const projectGroups = await prisma.project.findMany({
      where: { companyId },
      include: {
        transactions: {
          where: {
            transactionDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            type: 'INCOME',
          },
        },
        expenses: {
          where: {
            expenseDate: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
            category: { in: ['Material', 'Labor', 'Transport'] },
          },
        },
      },
    }).then(projects => 
      projects.map(project => {
        const totalIncome = project.transactions.reduce((sum, trx) => sum + Number(trx.amount), 0);
        const totalDirectCosts = project.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
        const netProfit = totalIncome - totalDirectCosts;
        
        return {
          projectId: project.id,
          projectName: project.name,
          projectStatus: project.status,
          totalIncome,
          totalDirectCosts,
          netProfit,
          transactions: [
            ...project.transactions.map(trx => ({
              id: trx.id,
              date: trx.transactionDate.toISOString(),
              description: trx.description,
              type: 'INCOME',
              amount: Number(trx.amount),
            })),
            ...project.expenses.map(exp => ({
              id: exp.id,
              date: exp.expenseDate.toISOString(),
              description: exp.description,
              type: exp.category,
              amount: Number(exp.amount),
            })),
          ],
        };
      })
    );

    // Group company expenses by category
    const companyExpenseGroups = operatingExpensesItems.reduce((groups: any, item) => {
      const key = `${item.type}-${item.projectName}`;
      if (!groups[key]) {
        groups[key] = {
          category: item.type,
          subCategory: item.projectName,
          totalAmount: 0,
          transactions: [],
        };
      }
      groups[key].totalAmount += item.amount;
      groups[key].transactions.push(item);
      return groups;
    }, {});

    const companyExpenseGroupsArray = Object.values(companyExpenseGroups);

    // Calculate realized vs potential project profit
    const realizedProjectProfit = projectGroups
      .filter(p => p.projectStatus === 'Completed')
      .reduce((sum, p) => sum + p.netProfit, 0);
    
    const potentialProjectProfit = projectGroups
      .filter(p => p.projectStatus === 'Active')
      .reduce((sum, p) => sum + p.netProfit, 0);

    // Generate monthly summary for charts
    const monthlySummary = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(today.getFullYear(), i, 1);
      const monthEnd = new Date(today.getFullYear(), i + 1, 0);
      
      const monthProjectIncome = allTransactions
        .filter(trx => 
          trx.type === 'INCOME' && 
          trx.projectId &&
          trx.transactionDate >= monthStart && 
          trx.transactionDate <= monthEnd
        )
        .reduce((sum, trx) => sum + Number(trx.amount), 0);
      
      const monthDirectCosts = allExpenses
        .filter(exp => 
          exp.projectId &&
          ['Material', 'Labor', 'Transport'].includes(exp.category) &&
          exp.expenseDate >= monthStart && 
          exp.expenseDate <= monthEnd
        )
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      
      const monthOperatingExpenses = [
        ...allExpenses.filter(exp => 
          (!exp.projectId || exp.category === 'Company Expense') &&
          exp.expenseDate >= monthStart && 
          exp.expenseDate <= monthEnd
        ),
        ...allTransactions.filter(trx => 
          trx.type === 'EXPENSE' && 
          !trx.projectId &&
          trx.transactionDate >= monthStart && 
          trx.transactionDate <= monthEnd
        )
      ].reduce((sum, item) => sum + Number(item.amount), 0);
      
      const monthNetProfit = monthProjectIncome - monthDirectCosts - monthOperatingExpenses;
      
      monthlySummary.push({
        month: months[i],
        projectIncome: monthProjectIncome,
        projectDirectCosts: monthDirectCosts,
        operatingExpenses: monthOperatingExpenses,
        netProjectProfit: monthNetProfit,
      });
    }

    return NextResponse.json({
      success: true,
      monthlySummary,
      projectIncomeItems,
      directProjectCostItems,
      operatingExpensesItems,
      projectGroups,
      companyExpenseGroups: companyExpenseGroupsArray,
      realizedProjectProfit,
      potentialProjectProfit,
      summary: {
        totalProjectIncome: projectIncomeItems.reduce((sum, item) => sum + item.amount, 0),
        totalDirectCosts: directProjectCostItems.reduce((sum, item) => sum + item.amount, 0),
        totalOperatingExpenses: operatingExpensesItems.reduce((sum, item) => sum + item.amount, 0),
        grossProfit: projectIncomeItems.reduce((sum, item) => sum + item.amount, 0) - directProjectCostItems.reduce((sum, item) => sum + item.amount, 0),
        netProfit: projectIncomeItems.reduce((sum, item) => sum + item.amount, 0) - directProjectCostItems.reduce((sum, item) => sum + item.amount, 0) - operatingExpensesItems.reduce((sum, item) => sum + item.amount, 0),
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Profit & Loss API Error:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}