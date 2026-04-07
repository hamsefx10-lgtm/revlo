import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const startTime = Date.now();
  let additionalCommissions = 0;
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

    console.log(`[Daily Report API] Date Range: ${selectedDate.toISOString()} to ${nextDay.toISOString()}`);

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
        vendor: { select: { name: true } },
      },
    });

    console.log(`[Daily Report API] Found ${expenses.length} expenses for date.`);

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
        employeeName: exp.employee?.fullName || null,
        vendorName: exp.vendor?.name || null,
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
    const mappedCompanyExpenses = companyExpenses
      .filter((exp: any) => exp.category !== 'Debt' && exp.subCategory !== 'Debt')
      .map(mapExpense);

    const totalProjectExpenses = mappedProjectExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    // Separate Bank Commissions (Category: Bank Charges) from other company expenses
    const bankCommissionsTx = mappedCompanyExpenses.filter((e: any) =>
      e.category === 'Bank Charges' || e.description.toLowerCase().includes('khidmad')
    );
    const totalBankCommissions = bankCommissionsTx.reduce((sum: number, e: any) => sum + e.amount, 0);

    const pureCompanyExpenses = mappedCompanyExpenses
      .filter((e: any) => e.category !== 'Bank Charges' && !e.description.toLowerCase().includes('khidmad'))
      .reduce((sum: number, e: any) => sum + e.amount, 0);

    const totalExpenses = totalProjectExpenses + pureCompanyExpenses + totalBankCommissions;

    console.log('[Daily Report API] Fetching income transactions...');
    // Income for selected date only - with full details
    // We now split this into pureIncome and loansReceived/debtCollected for the waterfall
    const incomeTxs = await prisma.transaction.findMany({
      where: {
        companyId,
        transactionDate: { gte: selectedDate, lt: nextDay },
        type: { in: ['INCOME', 'DEBT_RECEIVED', 'DEBT_REPAID'] }
      },
      include: {
        account: { select: { name: true } },
        project: { select: { name: true } },
        customer: { select: { name: true } },
        user: { select: { fullName: true } },
      },
    });

    const pureIncome = incomeTxs
      .filter(tx => tx.type === 'INCOME')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const totalLoansReceived = incomeTxs
      .filter(tx => tx.type === 'DEBT_RECEIVED')
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const totalDebtCollected = incomeTxs
      .filter(tx => 
        tx.type === 'DEBT_REPAID' && 
        !tx.vendorId && 
        !tx.expenseId && 
        !(tx.description && tx.description.includes('Flipped to Outflow'))
      )
      .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

    const totalIncome = pureIncome + totalLoansReceived + totalDebtCollected;
    console.log(`[Daily Report API] Income split: Pure=${pureIncome}, LoansRec=${totalLoansReceived}, DebtColl=${totalDebtCollected}`);

    // Map income transactions with details - FILTERED to exclude vendor repayments (outflows)
    const incomeTransactions = incomeTxs
      .filter((tx: any) => 
        !(tx.type === 'DEBT_REPAID' && (tx.vendorId || tx.expenseId || (tx.description && tx.description.includes('Flipped to Outflow'))))
      )
      .map((tx: any) => {
        let desc = tx.description || '';
        if (!desc) {
          if (tx.type === 'INCOME') desc = 'Dakhli (Income)';
          else if (tx.type === 'SHAREHOLDER_DEPOSIT') desc = 'Shareholder-Saamile (Deposit)';
          else if (tx.type === 'DEBT_REPAID') desc = 'Dayn La Bixiyay (Debt Collected)';
          else if (tx.type === 'DEBT_RECEIVED') desc = 'Dayn La Qaaday (Loan Received)';
          else desc = 'Dakhli';
        }

        return {
          id: tx.id,
          description: desc,
          amount: Number(tx.amount),
          account: tx.account?.name || 'N/A',
          project: tx.project?.name || null,
          customer: tx.customer?.name || null,
          note: tx.note || null,
          transactionDate: tx.transactionDate?.toISOString().slice(0, 10) || '',
          user: tx.user?.fullName || null,
        };
      });

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
      // Exclude types handled elsewhere: INCOME, DEBT_REPAID, DEBT_RECEIVED, TRANSFER_IN, TRANSFER_OUT
      const otherTransactions = await prisma.transaction.findMany({
        where: {
          companyId,
          transactionDate: { gte: selectedDate, lt: nextDay },
          type: { notIn: ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'TRANSFER_OUT'] },
        },
        orderBy: { transactionDate: 'desc' },
        include: {
          account: { select: { name: true } },
          project: { select: { name: true } },
          customer: { select: { name: true } },
          vendor: { select: { name: true } },
          user: { select: { fullName: true } },
          employee: { select: { fullName: true } },
        },
      });

      // Split otherTransactions into "Commissions" and "Actual Other Transactions"
      // Any transaction with Category 'Bank Charges' or 'khidmad' in desc is a commission
      const unmappedCommissions = otherTransactions.filter((tx: any) =>
        tx.category === 'Bank Charges' || tx.description?.toLowerCase().includes('khidmad')
      );

      additionalCommissions = unmappedCommissions.reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

      const filteredOtherTransactions = otherTransactions.filter((tx: any) =>
        tx.category !== 'Bank Charges' && !tx.description?.toLowerCase().includes('khidmad')
      );

      otherTransactionsList = filteredOtherTransactions.map((tx: any) => ({
        id: tx.id,
        description: tx.description || '',
        amount: Number(tx.amount),
        type: tx.type,
        account: tx.account?.name || 'N/A',
        project: tx.project?.name || null,
        customerName: tx.customer?.name || null,
        vendorName: tx.vendor?.name || null,
        employeeName: tx.employee?.fullName || null,
        user: tx.user?.fullName || null,
        category: tx.category || null,
        note: tx.note || null,
        transactionDate: tx.transactionDate?.toISOString().slice(0, 10) || '',
        vendorId: tx.vendorId || null,
        expenseId: tx.expenseId || null,
      }));
    } catch (otherTxError: any) {
      console.error('Error fetching other transactions:', otherTxError);
      otherTransactionsList = [];
    }

    console.log('[Daily Report API] Fetching account balances...');
    // Fetch live account balances for the company
    const accounts = await prisma.account.findMany({
      where: { companyId },
      select: { id: true, name: true, balance: true },
    });

    // Calculate balances for selected date (OPTIMIZED: single query + in-memory calculation)
    let balances: { previous: Record<string, number>; today: Record<string, number> } | null = null;
    let totalPrev = 0;
    let totalToday = 0;

    if (accounts.length > 0) {
      balances = { previous: {}, today: {} };
      const endOfToday = new Date(nextDay.getTime() - 1);

      // Fetch ALL transactions for the company up to the end of the selected date
      const allTx = await prisma.transaction.findMany({
        where: {
          companyId,
          transactionDate: { lte: endOfToday }
        },
        select: {
          accountId: true,
          fromAccountId: true,
          toAccountId: true,
          amount: true,
          type: true,
          transactionDate: true,
          vendorId: true,
          expenseId: true,
          description: true
        }
      });

      const startOfToday = selectedDate.getTime();
      const accountMap = new Map();
      accounts.forEach(acc => {
        accountMap.set(acc.id, { prev: 0, today: 0, name: acc.name });
      });

      allTx.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        const isPrev = trx.transactionDate.getTime() < startOfToday;

        // 1. Unified Transfer Logic (For new single-record transfers)
        if (!trx.accountId) {
          const fromAcc = accountMap.get(trx.fromAccountId as string);
          const toAcc = accountMap.get(trx.toAccountId as string);

          if (fromAcc) {
            fromAcc.today -= amount;
            if (isPrev) fromAcc.prev -= amount;
          }
          if (toAcc) {
            toAcc.today += amount;
            if (isPrev) toAcc.prev += amount;
          }
          return;
        }

        // 2. Standard Logic (For non-transfers and OLD dual-record transfers)
        // Note: For legacy transfers, each record has accountId set. 
        // We only process it for that specific accountId.
        const stats = accountMap.get(trx.accountId);
        if (!stats) return;

        const isStandardIn = [
          'INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && (!trx.vendorId && !trx.expenseId && !(trx.description && trx.description.includes('Flipped to Outflow'))));

        const isStandardOut = [
          'EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && (!!trx.vendorId || !!trx.expenseId || (trx.description && trx.description.includes('Flipped to Outflow'))));

        let change = 0;
        if (isStandardIn) change = amount;
        else if (isStandardOut) change = -amount;

        stats.today += change;
        if (isPrev) stats.prev += change;
      });

      accountMap.forEach(stats => {
        balances!.previous[stats.name] = stats.prev;
        balances!.today[stats.name] = stats.today;
        totalPrev += stats.prev;
        totalToday += stats.today;
      });
    }

    // Process all Dayn La Siiyay (Receivables Given / Debts Taken against us)
    const mapDebtExpense = (exp: any) => ({
      id: exp.id,
      description: exp.description || 'Deyn La Siiyay (Expense)',
      amount: Number(exp.amount),
      type: 'DEBT_GIVEN',
      account: exp.paidFrom || 'N/A',
      project: exp.project?.name || null,
      customerName: exp.customer?.name || exp.employee?.fullName || exp.vendor?.name || null,
      vendorName: exp.vendor?.name || null,
      employeeName: exp.employee?.fullName || null,
      note: exp.note || null,
      transactionDate: exp.expenseDate?.toISOString().slice(0, 10) || ''
    });

    const debtExpensesMapped = companyExpenses
      .filter((exp: any) => exp.category === 'Debt' || exp.subCategory === 'Debt')
      .map(mapDebtExpense);

    // Also include any raw transaction that effectively means we gave out a debt
    const rawDebtsGivenOrTaken = otherTransactionsList.filter(tx => 
      tx.type === 'DEBT_TAKEN' || 
      tx.type === 'DEBT_GIVEN' || 
      (tx.type === 'EXPENSE' && (tx.category === 'Debt' || (tx.description || '').toLowerCase().includes('debt')))
    );

    // Combine them while avoiding exact duplicate transaction/expense pairs
    const combinedDebtsGiven = [...rawDebtsGivenOrTaken];
    debtExpensesMapped.forEach((exp: any) => {
      // If we don't already have a transaction representing this exact expense
      if (!combinedDebtsGiven.some((tx: any) => tx.expenseId === exp.id || (tx.amount === exp.amount && tx.transactionDate === exp.transactionDate))) {
        combinedDebtsGiven.push(exp);
      }
    });

    const debtsTaken = combinedDebtsGiven;
    const debtsRepaid = otherTransactionsList.filter(tx => 
      tx.type === 'DEBT_REPAID' && 
      (!!tx.vendorId || !!tx.expenseId || (tx.description && tx.description.includes('Flipped to Outflow')))
    );
    const totalDebtsTaken = debtsTaken.reduce((s: number, t: any) => s + t.amount, 0);
    const totalDebtsRepaid = debtsRepaid.reduce((s: number, t: any) => s + t.amount, 0);
    const totalTransfersOut = transfers.reduce((s: number, t: any) => s + t.amount, 0);

    let displayDate = dateParam;
    if (!displayDate || isNaN(new Date(displayDate).getTime())) {
      const offset = selectedDate.getTimezoneOffset() * 60000;
      displayDate = new Date(selectedDate.getTime() - offset).toISOString().split('T')[0];
    }

    const responseData = {
      date: displayDate,
      companyName,
      companyLogoUrl,
      preparedBy,
      balances: balances || { previous: {}, today: {} },
      totalPrev: totalPrev,
      totalToday: totalToday,
      income: totalIncome,
      pureIncome: pureIncome,
      totalDebtCollected: totalDebtCollected,
      totalLoansReceived: totalLoansReceived,
      incomeTransactions: incomeTransactions || [],
      transfers: transfers || [],
      projectExpenses: mappedProjectExpenses || [],
      companyExpenses: mappedCompanyExpenses || [],
      pureCompanyExpenses: pureCompanyExpenses,
      totalBankCommissions: (totalBankCommissions + additionalCommissions),
      totalProjectExpenses: totalProjectExpenses,
      totalCompanyExpenses: (pureCompanyExpenses + totalBankCommissions + additionalCommissions),
      totalExpenses: (totalExpenses + additionalCommissions),
      fixedAssets: fixedAssetsList || [],
      totalFixedAssets: totalFixedAssets,
      debtsTaken,
      debtsRepaid,
      totalDebtsTaken: totalDebtsTaken,
      totalDebtsRepaid: totalDebtsRepaid,
      totalTransfersOut: totalTransfersOut,
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
