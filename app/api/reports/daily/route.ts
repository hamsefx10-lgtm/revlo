import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET(request: Request) {
  const startTime = Date.now();
  try {
    console.log('[Daily Report API] Starting request...');
    const sessionUser = await getSessionCompanyUser();
    if (!sessionUser || !sessionUser.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { companyId } = sessionUser;
    const preparedBy = sessionUser?.userName || 'System';
    console.log('[Daily Report API] Company ID:', companyId);

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { name: true, logoUrl: true }
    });
    const companyName = company?.name || sessionUser?.companyName || 'Birshiil Work Shop';
    const companyLogoUrl = company?.logoUrl || '/revlo-logo.png';

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

    console.log('[Daily Report API] Fetching debts...');
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

    console.log('[Daily Report API] Fetching expenses...');
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
        employee: { select: { fullName: true } },
      },
    });

    // Split expenses into project and company
    const projectExpenses = expenses.filter((exp: any) => exp.projectId !== null);
    const companyExpenses = expenses.filter((exp: any) => exp.projectId === null);

    // Map for frontend - Enhanced with additional fields
    const mapExpense = (exp: any) => {
      // Determine the display category - prefer subCategory if it exists
      let displayCategory = exp.expenseCategory?.name || exp.category || '';
      if (exp.subCategory && exp.subCategory !== 'Material' && exp.subCategory !== 'Company Labor') {
        displayCategory = exp.subCategory;
      }

      // Clean description: Remove "Category - " prefix if present to avoid redundancy
      let cleanDescription = exp.description || '';
      const prefix = `${displayCategory} - `;
      if (cleanDescription.startsWith(prefix)) {
        cleanDescription = cleanDescription.substring(prefix.length);
      }
      // Also check against raw category just in case
      const rawCategoryPrefix = `${exp.category} - `;
      if (exp.category && cleanDescription.startsWith(rawCategoryPrefix)) {
        cleanDescription = cleanDescription.substring(rawCategoryPrefix.length);
      }

      const baseExpense = {
        id: exp.id, // Add expense ID for editing
        date: exp.expenseDate?.toISOString().slice(0, 10) || '',
        project: exp.project?.name || String(exp.projectId) || 'Internal',
        category: displayCategory,
        description: cleanDescription,
        amount: Number(exp.amount),
        subCategory: exp.subCategory || null,
        note: exp.note || null,
        paidFrom: exp.paidFrom || 'Cash', // Add account info
      };

      // Add specific fields for company expenses
      if (!exp.projectId) {
        // Salary expense
        if (exp.subCategory === 'Salary' && exp.employee) {
          return {
            ...baseExpense,
            employeeName: exp.employee.fullName,
            expenseType: 'Salary',
            // Extract employee name from description if not available
            details: exp.employee.fullName ? `Shaqaale: ${exp.employee.fullName}` : null,
          };
        }

        // Office Rent - extract period from description
        if (exp.subCategory === 'Office Rent') {
          const periodMatch = exp.description?.match(/Office Rent - (.+?) -/);
          const period = periodMatch ? periodMatch[1] : (exp.rentalPeriod || null);
          return {
            ...baseExpense,
            rentalPeriod: period,
            expenseType: 'Office Rent',
            details: period ? `Muddada: ${period}` : null,
          };
        }

        // Electricity - extract meter reading from description
        if (exp.subCategory === 'Electricity') {
          const meterMatch = exp.description?.match(/Meter Reading:\s*(.+?)\s*-/);
          const meterReading = meterMatch ? meterMatch[1] : null;
          return {
            ...baseExpense,
            meterReading: meterReading,
            expenseType: 'Electricity',
            details: meterReading ? `Akhriska Korontada: ${meterReading}` : null,
          };
        }

        // Marketing - extract campaign name from description
        if (exp.subCategory === 'Marketing') {
          const campaignMatch = exp.description?.match(/Marketing - (.+?) -/);
          const campaignName = campaignMatch ? campaignMatch[1] : null;
          return {
            ...baseExpense,
            campaignName: campaignName,
            expenseType: 'Marketing',
            details: campaignName ? `Kampaniga: ${campaignName}` : null,
          };
        }

        // Company Labor
        if (exp.category === 'Company Labor' && exp.employee) {
          return {
            ...baseExpense,
            employeeName: exp.employee.fullName,
            expenseType: 'Company Labor',
            details: exp.employee.fullName ? `Shaqaale: ${exp.employee.fullName}` : null,
          };
        }

        // Material (company)
        if (exp.category === 'Material' && exp.materials) {
          return {
            ...baseExpense,
            materials: exp.materials,
            expenseType: 'Material',
          };
        }

        // Utilities
        if (exp.subCategory === 'Utilities') {
          return {
            ...baseExpense,
            expenseType: 'Utilities',
          };
        }
      }

      return baseExpense;
    };
    const mappedProjectExpenses = projectExpenses.map(mapExpense);
    const mappedCompanyExpenses = companyExpenses.map(mapExpense);
    const totalProjectExpenses = mappedProjectExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const totalCompanyExpenses = mappedCompanyExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);
    const totalExpenses = totalProjectExpenses + totalCompanyExpenses;

    console.log('[Daily Report API] Fetching income transactions...');
    // Income for selected date only - with full details
    const incomeTx = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: { gte: selectedDate, lt: nextDay },
        type: 'INCOME',
      },
      orderBy: { transactionDate: 'desc' },
      include: {
        account: { select: { name: true } },
        project: { select: { name: true } },
        customer: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    });
    const income = incomeTx.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    // Map income transactions with details
    const incomeTransactions = incomeTx.map((tx: any) => ({
      id: tx.id,
      description: tx.description || '',
      amount: Number(tx.amount),
      account: tx.account?.name || 'N/A',
      project: tx.project?.name || null,
      customer: tx.customer?.name || null,
      note: tx.note || null,
      transactionDate: tx.transactionDate?.toISOString().slice(0, 10) || '',
      user: tx.user?.fullName || null,
    }));

    console.log('[Daily Report API] Fetching transfer transactions...');
    // Transfer transactions - showing money movement between accounts
    const transferTx = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: { gte: selectedDate, lt: nextDay },
        type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
      },
      orderBy: { transactionDate: 'desc' },
      include: {
        account: { select: { name: true } },
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    });

    // Group transfers - TRANSFER_OUT transactions show the transfer (they have fromAccount and toAccount)
    const transferMap = new Map();
    transferTx.forEach((tx: any) => {
      // Use TRANSFER_OUT as the main transaction (it has fromAccount and toAccount)
      if (tx.type === 'TRANSFER_OUT' && tx.fromAccountId && tx.toAccountId) {
        const key = `${tx.fromAccountId}-${tx.toAccountId}-${tx.transactionDate.toISOString()}`;
        if (!transferMap.has(key)) {
          transferMap.set(key, {
            id: tx.id,
            description: tx.description || '',
            amount: Math.abs(Number(tx.amount)),
            fromAccount: tx.fromAccount?.name || 'N/A',
            toAccount: tx.toAccount?.name || 'N/A',
            transactionDate: tx.transactionDate?.toISOString().slice(0, 10) || '',
            note: tx.note || null,
            user: tx.user?.fullName || null,
            type: 'TRANSFER',
          });
        }
      } else if (tx.type === 'TRANSFER_IN' && !tx.fromAccountId && !tx.toAccountId) {
        // If TRANSFER_IN doesn't have fromAccount/toAccount, try to find matching TRANSFER_OUT
        // or create a standalone entry
        const key = `in-${tx.accountId}-${tx.transactionDate.toISOString()}`;
        if (!transferMap.has(key)) {
          transferMap.set(key, {
            id: tx.id,
            description: tx.description || 'Wareejin',
            amount: Math.abs(Number(tx.amount)),
            fromAccount: 'N/A',
            toAccount: tx.account?.name || 'N/A',
            transactionDate: tx.transactionDate?.toISOString().slice(0, 10) || '',
            note: tx.note || null,
            user: tx.user?.fullName || null,
            type: 'TRANSFER',
          });
        }
      }
    });

    const transfers = Array.from(transferMap.values());

    // Fixed Assets purchased on selected date
    let fixedAssetsList: any[] = [];
    let totalFixedAssets = 0;

    try {
      console.log('[Daily Report API] Fetching fixed assets...');
      const fixedAssets = await prisma.fixedAsset.findMany({
        where: {
          companyId,
          purchaseDate: { gte: selectedDate, lt: nextDay },
        },
        orderBy: { purchaseDate: 'desc' },
      });

      // Get fixed asset transactions to find vendor info
      const fixedAssetTransactions = await prisma.transaction.findMany({
        where: {
          companyId,
          transactionDate: { gte: selectedDate, lt: nextDay },
          category: 'FIXED_ASSET_PURCHASE',
        },
        include: {
          // vendor: { select: { name: true } },
        },
      });

      // Create a map of asset names to vendors from transactions
      const assetVendorMap = new Map();
      fixedAssetTransactions.forEach((tx: any) => {
        if (tx.description) {
          const assetNameMatch = tx.description.match(/Fixed Asset Purchase - (.+)/);
          if (assetNameMatch) {
            const assetName = assetNameMatch[1];
            if (!assetVendorMap.has(assetName) && tx.vendor) {
              assetVendorMap.set(assetName, tx.vendor.name);
            }
          }
        }
      });

      fixedAssetsList = fixedAssets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        type: asset.type,
        value: Number(asset.value),
        purchaseDate: asset.purchaseDate?.toISOString().slice(0, 10) || '',
        vendor: assetVendorMap.get(asset.name) || null,
        assignedTo: asset.assignedTo || null,
      }));

      totalFixedAssets = fixedAssetsList.reduce((sum: number, asset: any) => sum + asset.value, 0);
    } catch (fixedAssetError: any) {
      console.error('Error fetching fixed assets:', fixedAssetError);
      // Continue without fixed assets if there's an error
      fixedAssetsList = [];
      totalFixedAssets = 0;
    }

    // All other transactions (EXPENSE, DEBT_TAKEN, DEBT_REPAID, etc.) - excluding INCOME and TRANSFER which are already handled
    let otherTransactionsList: any[] = [];

    try {
      console.log('[Daily Report API] Fetching other transactions...');
      const otherTransactions = await prisma.transaction.findMany({
        where: {
          companyId,
          transactionDate: { gte: selectedDate, lt: nextDay },
          type: { notIn: ['INCOME', 'TRANSFER_IN', 'TRANSFER_OUT'] },
        },
        orderBy: { transactionDate: 'desc' },
        include: {
          account: { select: { name: true } },
          project: { select: { name: true } },
          customer: { select: { name: true } },
          // vendor: { select: { name: true } },
          user: { select: { fullName: true } },
          employee: { select: { fullName: true } },
        },
      });

      otherTransactionsList = otherTransactions.map((tx: any) => ({
        id: tx.id,
        description: tx.description || '',
        amount: Number(tx.amount),
        type: tx.type,
        account: tx.account?.name || 'N/A',
        project: tx.project?.name || null,
        customer: tx.customer?.name || null,
        vendor: tx.vendor?.name || null,
        employee: tx.employee?.fullName || null,
        user: tx.user?.fullName || null,
        category: tx.category || null,
        note: tx.note || null,
        transactionDate: tx.transactionDate?.toISOString().slice(0, 10) || '',
      }));
    } catch (otherTxError: any) {
      console.error('Error fetching other transactions:', otherTxError);
      // Continue without other transactions if there's an error
      otherTransactionsList = [];
    }

    console.log('[Daily Report API] Fetching account balances...');
    // Fetch live account balances for the company
    const accounts = await prisma.account.findMany({
      where: { companyId },
      select: { id: true, name: true, balance: true },
    });

    // Calculate balances for selected date (accurate snapshot)
    let balances: { previous: Record<string, number>; today: Record<string, number> } | null = null;
    let totalPrev: number | null = null;
    let totalToday: number | null = null;

    if (accounts.length > 0) {
      balances = {
        previous: {},
        today: {},
      };

      const accountIds = accounts.map(acc => acc.id);
      const endOfSelectedDate = new Date(nextDay.getTime() - 1);
      const now = new Date();

      // Fetch all transactions after the previous day to adjust balances backwards
      const allTransactions = await prisma.transaction.findMany({
        where: {
          companyId,
          accountId: { in: accountIds },
          transactionDate: { gt: previousDay, lte: now },
        },
        select: {
          accountId: true,
          amount: true,
          type: true,
          transactionDate: true,
        },
      });

      const getNetEffect = (transactions: any[]) => {
        return transactions.reduce((sum: number, tx: any) => {
          const amount = Math.abs(Number(tx.amount));
          if (['INCOME', 'DEBT_REPAID', 'TRANSFER_IN'].includes(tx.type)) {
            return sum + amount;
          } else if (['EXPENSE', 'DEBT_TAKEN', 'TRANSFER_OUT'].includes(tx.type)) {
            return sum - amount;
          }
          return sum;
        }, 0);
      };

      for (const acc of accounts) {
        const accountTransactions = allTransactions.filter(tx => tx.accountId === acc.id);

        // Transactions after selected date (to backtrack to selected date end)
        const transactionsAfterSelectedDate = accountTransactions.filter(
          tx => tx.transactionDate > endOfSelectedDate && tx.transactionDate <= now
        );
        const todayBalanceSnapshot = Number(acc.balance) - getNetEffect(transactionsAfterSelectedDate);

        // Transactions after previous day end (to backtrack to previous day)
        const transactionsAfterPreviousDay = accountTransactions.filter(
          tx => tx.transactionDate > previousDay && tx.transactionDate <= now
        );
        const previousBalanceSnapshot = Number(acc.balance) - getNetEffect(transactionsAfterPreviousDay);

        balances.previous[acc.name] = previousBalanceSnapshot;
        balances.today[acc.name] = todayBalanceSnapshot;
      }

      totalPrev = Object.values(balances.previous).reduce((sum: number, val: number) => sum + val, 0);
      totalToday = Object.values(balances.today).reduce((sum: number, val: number) => sum + val, 0);
    }

    const responseData = {
      date: selectedDate.toISOString().slice(0, 10),
      companyName,
      companyLogoUrl,
      preparedBy,
      balances: balances || { previous: {}, today: {} },
      totalPrev: totalPrev ?? 0,
      totalToday: totalToday ?? 0,
      income: income ?? 0,
      incomeTransactions: incomeTransactions || [],
      transfers: transfers || [],
      projectExpenses: mappedProjectExpenses || [],
      companyExpenses: mappedCompanyExpenses || [],
      totalProjectExpenses: totalProjectExpenses ?? 0,
      totalCompanyExpenses: totalCompanyExpenses ?? 0,
      totalExpenses: totalExpenses ?? 0,
      debtsCollected,
      fixedAssets: fixedAssetsList || [],
      totalFixedAssets: totalFixedAssets ?? 0,
      otherTransactions: otherTransactionsList || [],
    };

    const duration = Date.now() - startTime;
    console.log(`[Daily Report API] Request completed in ${duration}ms`);

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error('Daily Report API error:', error);
    console.error('Error details:', error?.message, error?.stack);
    return NextResponse.json({
      message: 'Cilad server ayaa dhacday.',
      error: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 });
  }
}
