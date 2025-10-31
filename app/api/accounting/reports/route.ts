// app/api/accounting/reports/route.ts - Accounting Reports API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type
import { getSessionCompanyId } from './auth';

// GET /api/accounting/reports - Soo deji xogta guud ee warbixinada accounting-ga
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
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
    const monthlyTransactions = await prisma.transaction.findMany({
      where: {
        transactionDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        companyId,
      },
    });
    let totalIncomeThisMonth = 0;
    let totalExpensesThisMonth = 0;
    
    // Calculate TOTAL income from transactions (all time)
    const allTransactions = await prisma.transaction.findMany({
      where: {
        companyId,
      },
    });
    
    let totalIncome = 0;
    allTransactions.forEach(trx => {
      if (trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' || trx.type === 'DEBT_REPAID') {
        // DEBT_REPAID is income (money received from customer)
        totalIncome += Math.abs(trx.amount.toNumber());
      }
    });
    
    // Calculate monthly income for comparison
    monthlyTransactions.forEach(trx => {
      if (trx.type === 'INCOME' || trx.type === 'TRANSFER_IN' || trx.type === 'DEBT_REPAID') {
        // DEBT_REPAID is income (money received from customer)
        totalIncomeThisMonth += Math.abs(trx.amount.toNumber());
      }
    });
    
    // Calculate TOTAL expenses from transactions (all time) - matching transactions page logic
    // DEBT_TAKEN = expense (outflow), exclude FIXED_ASSET_PURCHASE
    let totalExpenses = 0;
    allTransactions.forEach(trx => {
      if (trx.type === 'EXPENSE' || trx.type === 'TRANSFER_OUT' || trx.type === 'DEBT_TAKEN') {
        // Exclude fixed asset purchases from expenses
        if (trx.category !== 'FIXED_ASSET_PURCHASE') {
          totalExpenses += Math.abs(trx.amount.toNumber());
        }
      }
    });
    
    // Calculate monthly expenses from transactions
    monthlyTransactions.forEach(trx => {
      if (trx.type === 'EXPENSE' || trx.type === 'TRANSFER_OUT' || trx.type === 'DEBT_TAKEN') {
        // Exclude fixed asset purchases from expenses
        if (trx.category !== 'FIXED_ASSET_PURCHASE') {
          totalExpensesThisMonth += Math.abs(trx.amount.toNumber());
        }
      }
    });
    
    // Calculate fixed asset expenses separately (all time)
    let fixedAssetExpenses = 0;
    allTransactions.forEach(trx => {
      if (trx.category === 'FIXED_ASSET_PURCHASE') {
        fixedAssetExpenses += Math.abs(trx.amount.toNumber());
      }
    });
    
    // Calculate monthly fixed asset expenses
    let fixedAssetExpensesThisMonth = 0;
    monthlyTransactions.forEach(trx => {
      if (trx.category === 'FIXED_ASSET_PURCHASE') {
        fixedAssetExpensesThisMonth += Math.abs(trx.amount.toNumber());
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

    const totalBankAccounts = accountTypeCounts.find(count => count.type === 'BANK')?._count.id || 0;
    const totalCashAccounts = accountTypeCounts.find(count => count.type === 'CASH')?._count.id || 0;
    const totalMobileMoneyAccounts = accountTypeCounts.find(count => count.type === 'MOBILE_MONEY')?._count.id || 0;


    return NextResponse.json(
      {
        totalBalance: totalBalance,
        totalIncomeThisMonth: totalIncomeThisMonth,
        totalIncome: totalIncome, // Total income (all time)
        totalExpensesThisMonth: totalExpensesThisMonth,
        totalExpenses: totalExpenses, // Total expenses (all time, excluding fixed assets)
        fixedAssetExpenses: fixedAssetExpenses, // Fixed asset expenses (all time)
        fixedAssetExpensesThisMonth: fixedAssetExpensesThisMonth, // Fixed asset expenses this month
        netFlowThisMonth: netFlowThisMonth,
        totalBankAccounts: totalBankAccounts,
        totalCashAccounts: totalCashAccounts,
        totalMobileMoneyAccounts: totalMobileMoneyAccounts,
        // Add more aggregated data for reports as needed
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
