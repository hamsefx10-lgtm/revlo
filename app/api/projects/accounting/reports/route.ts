import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type from runtime library
import { getSessionCompanyUser } from '@/lib/auth'; // Use central auth helper

// GET /api/projects/accounting/reports - Soo deji xogta guud ee warbixinada accounting-ga
export async function GET(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid. Fadlan soo gal.' }, { status: 401 });
    }
    const { companyId } = sessionData;
    const totalBalanceResult = await prisma.account.aggregate({
      _sum: {
        balance: true,
      },
      where: { companyId },
    });
    const totalBalance = totalBalanceResult._sum.balance ? Number(totalBalanceResult._sum.balance) : 0;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // --- Aggregate Project Advances ---
    const allProjectsAdvanceResult = await prisma.project.aggregate({
      _sum: { advancePaid: true },
      where: { companyId }
    });
    const totalProjectAdvances = allProjectsAdvanceResult._sum.advancePaid ? Number(allProjectsAdvanceResult._sum.advancePaid) : 0;

    const monthlyProjectsAdvanceResult = await prisma.project.aggregate({
      _sum: { advancePaid: true },
      where: {
        companyId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      }
    });
    const totalProjectAdvancesThisMonth = monthlyProjectsAdvanceResult._sum.advancePaid ? Number(monthlyProjectsAdvanceResult._sum.advancePaid) : 0;

    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        companyId,
      },
    });

    const allTransactions = await prisma.transaction.findMany({
      where: { companyId }
    });

    let totalIncome = totalProjectAdvances;
    let totalExpenses = 0;

    let totalIncomeThisMonth = totalProjectAdvancesThisMonth;
    let totalExpensesThisMonth = 0;

    let totalCashInflow = totalProjectAdvances;
    let totalCashOutflow = 0;
    let totalPayablesReceived = 0;

    allTransactions.forEach(trx => {
      const amount = Math.abs(typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount));
      const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

      // 1. Operating Income Logic
      if (trx.type === 'INCOME' && !isAutoAdvance) {
        totalIncome += amount;
      } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
        totalIncome += amount;
      }

      // 2. Operating Expenses Logic
      if (trx.type === 'EXPENSE' || trx.type === 'DEBT_TAKEN' || trx.type === 'DEBT_GIVEN' || (trx.type === 'DEBT_REPAID' && trx.vendorId)) {
        if (trx.category !== 'FIXED_ASSET_PURCHASE') {
          totalExpenses += amount;
        }
      }

      // 3. Gross Inflow/Outflow (Shilin kasta)
      const isUnifiedTransfer = trx.accountId === null && (trx.fromAccountId || trx.toAccountId);
      const isGhostTransaction = trx.accountId === null && !isUnifiedTransfer;

      if (!isGhostTransaction) {
        // Positive flows to accounts
        if (
          ['INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED'].includes(trx.type) ||
          (trx.type === 'DEBT_REPAID' && !trx.vendorId) ||
          (trx.type === 'TRANSFER_OUT' && trx.accountId === null)
        ) {
          // If INCOME and isAutoAdvance, it's already in totalProjectAdvances
          if (!(trx.type === 'INCOME' && isAutoAdvance)) {
            totalCashInflow += amount;
          }
        }
        // Negative flows from accounts
        if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type)) {
          totalCashOutflow += amount;
        }
        if (trx.type === 'DEBT_REPAID' && trx.vendorId) {
          totalCashOutflow += amount;
        }

        // 4. Payables Logic (Debt Received)
        if (trx.type === 'DEBT_RECEIVED') {
          totalPayablesReceived += amount;
        }
      }
    });

    // Monthly calculations
    let totalCashInflowThisMonth = totalProjectAdvancesThisMonth;
    let totalCashOutflowThisMonth = 0;
    let totalPayablesReceivedThisMonth = 0;

    monthlyTransactions.forEach(trx => {
      const amount = Math.abs(typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount));
      const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

      if (trx.type === 'INCOME' && !isAutoAdvance) {
        totalIncomeThisMonth += amount;
      } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
        totalIncomeThisMonth += amount;
      }

      if (trx.type === 'EXPENSE' || trx.type === 'DEBT_TAKEN' || trx.type === 'DEBT_GIVEN' || (trx.type === 'DEBT_REPAID' && trx.vendorId)) {
        if (trx.category !== 'FIXED_ASSET_PURCHASE') {
          totalExpensesThisMonth += amount;
        }
      }

      // Gross Monthly
      const isUnifiedTransfer = trx.accountId === null && (trx.fromAccountId || trx.toAccountId);
      const isGhostTransaction = trx.accountId === null && !isUnifiedTransfer;

      if (!isGhostTransaction) {
        if (
          ['INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED'].includes(trx.type) ||
          (trx.type === 'DEBT_REPAID' && !trx.vendorId) ||
          (trx.type === 'TRANSFER_OUT' && trx.accountId === null)
        ) {
          if (!(trx.type === 'INCOME' && isAutoAdvance)) {
            totalCashInflowThisMonth += amount;
          }
        }
        if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type)) {
          totalCashOutflowThisMonth += amount;
        }
        if (trx.type === 'DEBT_REPAID' && trx.vendorId) {
          totalCashOutflowThisMonth += amount;
        }

        if (trx.type === 'DEBT_RECEIVED') {
          totalPayablesReceivedThisMonth += amount;
        }
      }
    });

    // FIXED_ASSET_PURCHASE logic (already correct, but ensure consistency)
    let fixedAssetExpenses = 0;
    allTransactions.forEach(trx => {
      if (trx.category === 'FIXED_ASSET_PURCHASE') {
        fixedAssetExpenses += Math.abs(typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount));
      }
    });

    let fixedAssetExpensesThisMonth = 0;
    monthlyTransactions.forEach(trx => {
      if (trx.category === 'FIXED_ASSET_PURCHASE') {
        fixedAssetExpensesThisMonth += Math.abs(typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount));
      }
    });

    const netFlowThisMonth = totalIncomeThisMonth - totalExpensesThisMonth;
    const accountTypeCounts = await prisma.account.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
      where: { companyId },
    });

    // Chart Data calculations
    const allAccounts = await prisma.account.findMany({ where: { companyId } });
    const accountDistribution = allAccounts.map(acc => ({
      name: String(acc.name),
      value: Number(acc.balance)
    })).filter(acc => acc.value > 0);

    const monthlyCashFlowMap: Record<string, { month: string; income: number; expense: number; net: number }> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthlyCashFlowMap[monthStr] = { month: monthStr, income: 0, expense: 0, net: 0 };
    }

    allTransactions.forEach(trx => {
      const d = new Date(trx.transactionDate);
      const monthStr = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      
      if (monthlyCashFlowMap[monthStr]) {
        const amount = Math.abs(typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount));
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

        let isIncome = false;
        let isExpense = false;

        if (trx.type === 'INCOME' && !isAutoAdvance) isIncome = true;
        if (trx.type === 'DEBT_REPAID' && !trx.vendorId) isIncome = true;

        if (trx.type === 'EXPENSE' || trx.type === 'DEBT_TAKEN' || trx.type === 'DEBT_GIVEN' || (trx.type === 'DEBT_REPAID' && trx.vendorId)) {
           if (trx.category !== 'FIXED_ASSET_PURCHASE') isExpense = true;
        }

        if (isIncome) monthlyCashFlowMap[monthStr].income += amount;
        if (isExpense) monthlyCashFlowMap[monthStr].expense += amount;
        monthlyCashFlowMap[monthStr].net = monthlyCashFlowMap[monthStr].income - monthlyCashFlowMap[monthStr].expense;
      }
    });

    const monthlyCashFlow = Object.values(monthlyCashFlowMap);

    const totalBankAccounts = accountTypeCounts.find(count => count.type === 'BANK')?._count.id || 0;
    const totalCashAccounts = accountTypeCounts.find(count => count.type === 'CASH')?._count.id || 0;
    const totalMobileMoneyAccounts = accountTypeCounts.find(count => count.type === 'MOBILE_MONEY')?._count.id || 0;

    return NextResponse.json(
      {
        totalBalance: totalBalance,
        totalIncomeThisMonth: totalIncomeThisMonth,
        totalIncome: totalIncome,
        totalExpensesThisMonth: totalExpensesThisMonth,
        totalExpenses: totalExpenses,
        totalCashInflow: totalCashInflow,
        totalCashOutflow: totalCashOutflow,
        totalCashOutflowThisMonth: totalCashOutflowThisMonth,
        totalPayablesReceived: totalPayablesReceived,
        totalPayablesReceivedThisMonth: totalPayablesReceivedThisMonth,
        fixedAssetExpenses: fixedAssetExpenses,
        fixedAssetExpensesThisMonth: fixedAssetExpensesThisMonth,
        netFlowThisMonth: netFlowThisMonth,
        totalBankAccounts: totalBankAccounts,
        totalCashAccounts: totalCashAccounts,
        totalMobileMoneyAccounts: totalMobileMoneyAccounts,
        monthlyCashFlow: monthlyCashFlow,
        accountDistribution: accountDistribution,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka xogta warbixinada la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
