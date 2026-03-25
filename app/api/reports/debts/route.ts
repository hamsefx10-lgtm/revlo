export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// Enhanced Debts report: Aggregates company debts and receivables with detailed information
export async function GET(req: Request) {
  try {
    // Get companyId from session with proper authentication
    const session = await getSessionCompanyUser();
    const companyId = session?.companyId;

    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Get all transactions related to debts and receivables for the company
    const allTransactions = await prisma.transaction.findMany({
      where: {
        companyId,
        OR: [
          { type: 'DEBT_TAKEN' },
          { type: 'DEBT_REPAID' },
          { type: 'DEBT_RECEIVED' },
          { type: 'DEBT_GIVEN' }
        ]
      },
      include: {
        vendor: true,
        customer: true,
        account: true,
        project: true,
        company: true,
      },
      orderBy: {
        transactionDate: 'desc'
      }
    });

    // Get all projects with their debt information
    const allProjects = await prisma.project.findMany({
      where: { companyId },
      include: {
        customer: true,
        transactions: {
          where: {
            OR: [
              { type: 'DEBT_TAKEN' },
              { type: 'DEBT_REPAID' },
              { type: 'DEBT_RECEIVED' },
              { type: 'DEBT_GIVEN' }
            ]
          }
        }
      }
    });

    // Get all purchase orders to calculate vendor debt accurately
    const allPOs = await prisma.purchaseOrder.findMany({
      where: { companyId },
      include: {
        vendor: true,
        project: true
      }
    });

    // Also get all expenses that might have debt information for the company
    // IMPORTANT: Get ALL expenses with category 'Debt' OR (category 'Company Expense' AND subCategory 'Debt')
    // This includes expenses that may or may not have corresponding transactions
    const allExpenses = await prisma.expense.findMany({
      where: {
        companyId,
        OR: [
          { category: 'Debt' },
          {
            category: 'Company Expense',
            subCategory: 'Debt'
          },
          { category: 'Debt Repayment' },
          { vendorId: { not: null } }, // ALL Vendor expenses might have debt
          { description: { contains: 'debt', mode: 'insensitive' } },
          { description: { contains: 'loan', mode: 'insensitive' } },
          { description: { contains: 'credit', mode: 'insensitive' } },
          { description: { contains: 'deyn', mode: 'insensitive' } },
          { description: { contains: 'qard', mode: 'insensitive' } },
          { description: { contains: 'dayn', mode: 'insensitive' } },
          { description: { contains: 'qardh', mode: 'insensitive' } }
        ]
      },
      include: {
        vendor: true,
        customer: true,
        project: true,
        company: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all transaction IDs that are linked to expenses (to check which expenses already have transactions)
    const expenseTransactionMap = new Map<string, boolean>();
    allTransactions.forEach((tx: any) => {
      if (tx.expenseId) {
        expenseTransactionMap.set(tx.expenseId, true);
      }
    });

    // -------------------------------------------------------------------------
    // UNIFIED VENDOR DEBT CALCULATION (Payables)
    // -------------------------------------------------------------------------
    const vendorDebtMap: Record<string, any> = {};

    // 1. Incorporate ALL Vendor Expenses (Credit Purchases)
    allExpenses.forEach((expense: any) => {
      if (!expense.vendorId) return;
      
      const projectKey = expense.projectId || 'general';
      const entityKey = `${expense.vendorId}_${projectKey}`;
      const amount = Math.abs(Number(expense.amount) || 0);

      if (!vendorDebtMap[entityKey]) {
        vendorDebtMap[entityKey] = {
          id: expense.vendorId,
          lender: expense.vendor?.name || 'Unknown Vendor',
          lenderId: expense.vendorId,
          companyId: expense.companyId,
          companyName: 'Company',
          type: 'Vendor Credit',
          amount: 0,
          paid: 0,
          remaining: 0,
          issueDate: expense.createdAt,
          dueDate: new Date(new Date(expense.createdAt).getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'Active',
          project: expense.project?.name || (expense.projectId ? 'Project Account' : 'General'),
          projectId: expense.projectId || '',
          phoneNumber: expense.vendor?.phoneNumber || '',
          email: '',
          isLiability: true,
          isReceivable: false,
          transactions: []
        };
      }
      
      vendorDebtMap[entityKey].amount += amount;
    });

    // 2. Incorporate Transactions (Payments and standalone Loans)
    allTransactions.forEach((transaction: any) => {
      if (!transaction.vendorId || transaction.companyId !== companyId) return;
      
      const projectKey = transaction.projectId || 'general';
      const entityKey = `${transaction.vendorId}_${projectKey}`;
      const amount = Math.abs(Number(transaction.amount) || 0);

      if (!vendorDebtMap[entityKey]) {
        vendorDebtMap[entityKey] = {
          id: transaction.vendorId,
          lender: transaction.vendor?.name || 'Unknown Vendor',
          lenderId: transaction.vendorId,
          companyId: transaction.companyId,
          companyName: 'Company',
          type: 'Vendor Loan',
          amount: 0,
          paid: 0,
          remaining: 0,
          issueDate: transaction.transactionDate,
          dueDate: new Date(new Date(transaction.transactionDate).getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'Active',
          project: transaction.project?.name || (transaction.projectId ? 'Project Account' : 'General'),
          projectId: transaction.projectId || '',
          phoneNumber: transaction.vendor?.phoneNumber || '',
          email: '',
          isLiability: true,
          isReceivable: false,
          transactions: []
        };
      }

      // Logic:
      // DEBT_TAKEN/RECEIVED: Increase debt amount (e.g. cash loan)
      // DEBT_REPAID/EXPENSE: Cash outflow (Payment reducing debt)
      if (transaction.type === 'DEBT_TAKEN' || transaction.type === 'DEBT_RECEIVED') {
        // Only add to amount if NOT already linked to an expense (to avoid double counting credit bills)
        if (!transaction.expenseId) {
          vendorDebtMap[entityKey].amount += amount;
        }
      } else if (transaction.type === 'DEBT_REPAID' || transaction.type === 'EXPENSE') {
        vendorDebtMap[entityKey].paid += amount;
      }
      
      vendorDebtMap[entityKey].transactions.push(transaction);
    });

    // Final processing for vendor debts (Unified Payables/Receivables logic)
    const processedVendorDebts = Object.values(vendorDebtMap).map((item: any) => {
      const remaining = item.amount - item.paid;
      
      // If remaining is negative, it's actually a Receivable (we overpaid the vendor)
      if (remaining < 0) {
        item.isLiability = false;
        item.isReceivable = true;
        item.remaining = Math.abs(remaining);
      } else {
        item.isLiability = true;
        item.isReceivable = false;
        item.remaining = remaining;
      }
      
      // Determine status
      if (item.remaining <= 0) {
        item.status = 'Paid';
      } else {
        const dueDate = new Date(item.dueDate);
        if (dueDate < new Date()) {
          item.status = 'Overdue';
        } else {
          item.status = 'Active';
        }
      }
      return item;
    });

    // -------------------------------------------------------------------------
    // RECEIVABLES CALCULATION (Money Owed TO us)
    // -------------------------------------------------------------------------
    const customerReceivableMap: Record<string, any> = {};

    // Process transactions for receivables
    allTransactions.forEach((transaction: any) => {
      if (!transaction.customerId || transaction.companyId !== companyId) return;
      
      const customerKey = `${transaction.customerId}_${transaction.companyId}_${transaction.projectId || 'general'}`;
      const amount = Math.abs(Number(transaction.amount) || 0);

      if (!customerReceivableMap[customerKey]) {
        customerReceivableMap[customerKey] = {
          id: transaction.customerId,
          client: transaction.customer?.name || 'Unknown Client',
          clientId: transaction.customerId,
          companyId: transaction.companyId,
          companyName: 'Company',
          project: transaction.project?.name || (transaction.projectId ? 'Project Account' : 'General'),
          projectId: transaction.projectId || '',
          amount: 0,
          received: 0,
          remaining: 0,
          issueDate: transaction.transactionDate,
          dueDate: new Date(new Date(transaction.transactionDate).getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
          status: 'Upcoming',
          type: transaction.projectId ? 'Project Related' : 'Direct Loan',
          phoneNumber: transaction.customer?.phoneNumber || '',
          email: transaction.customer?.email || '',
          isLiability: false,
          isReceivable: true,
          transactions: []
        };
      }

      // Math Logic: 
      // DEBT_GIVEN: Company gave to customer (+)
      // DEBT_TAKEN/RECEIVED/REPAID: Customer gave to company (-)
      if (transaction.type === 'DEBT_GIVEN') {
        customerReceivableMap[customerKey].amount += amount;
      } else {
        customerReceivableMap[customerKey].received += amount;
      }
      
      customerReceivableMap[customerKey].transactions.push(transaction);
    });

    // Create final receivables array (Unified Payables/Receivables logic)
    const processedCustomerReceivables = Object.values(customerReceivableMap).map((receivable: any) => {
      const remaining = receivable.amount - receivable.received;
      
      // If remaining is negative, it's actually a Liability (customer overpaid us)
      if (remaining < 0) {
        receivable.isLiability = true;
        receivable.isReceivable = false;
        receivable.remaining = Math.abs(remaining);
        receivable.type = 'Customer Overpayment';
      } else {
        receivable.isLiability = false;
        receivable.isReceivable = true;
        receivable.remaining = remaining;
        // Keep existing type or refine
        if (!receivable.projectId) receivable.type = 'Direct Loan';
      }
      
      if (receivable.remaining <= 0) {
        receivable.status = 'Paid';
      } else {
        const dueDate = new Date(receivable.dueDate);
        if (dueDate < new Date()) {
          receivable.status = 'Overdue';
        } else {
          receivable.status = 'Upcoming';
        }
      }
      return receivable;
    });
    
    // Process project debts (Usually Receivables)
    const projectReceivablesData = allProjects.map((project: any) => {
      const agreementAmount = Math.abs(Number(project.agreementAmount || 0));
      const advancePaid = Math.abs(Number(project.advancePaid || 0));

      // Calculate debt transactions for this project
      const projectDebtTransactions = project.transactions.filter((trx: any) => trx.type === 'DEBT_TAKEN');

      // Deduplication Logic v2: Identify and suppress the auto-generated advance transaction
      const advanceTransaction = project.transactions.find((t: any) => {
        const isIncome = t.type === 'INCOME';
        const trxTime = new Date(t.transactionDate).getTime();
        const projTime = new Date(project.createdAt).getTime();
        const isCloseTime = Math.abs(trxTime - projTime) < 5 * 60 * 1000;
        const desc = (t.description || '').toLowerCase();
        const isAutoGenerated = desc.includes('advance payment for project');
        return isIncome && isCloseTime && isAutoGenerated;
      });

      // INCLUDE 'INCOME' transactions as payments towards the project debt, EXCLUDING auto-generated
      const projectRepaymentTransactions = project.transactions.filter((trx: any) =>
        (trx.type === 'DEBT_REPAID' || trx.type === 'INCOME') && trx.id !== advanceTransaction?.id
      );

      const totalRepaidAmount = projectRepaymentTransactions.reduce((sum: number, trx: any) => sum + Math.abs(Number(trx.amount)), 0);

      // Total Revenue Collected = Initial Advance (Static Field) + Other Repayments
      const totalCollected = advancePaid + totalRepaidAmount;

      // Project Expenses (to calculate out-of-pocket deficit)
      // Since allProjects include doesn't have expenses, we'll calculate based on project debt transactions if applicable
      // OR better, we know the user wants to see "Spent > Collected" as debt.
      // However, the debt report here doesn't have the expenses joined.
      // Fortunately, the global `allExpenses` might have them.
      const projectExpenses = allExpenses.filter((e: any) => e.projectId === project.id);
      const totalSpent = projectExpenses.reduce((sum, e) => sum + Math.abs(Number(e.amount)), 0);

      // Remaining Contractual Balance
      const remainingContract = agreementAmount - totalCollected;
      
      // Cash Deficit (Money the shirkad spent out of pocket)
      const cashDeficit = Math.max(0, totalSpent - totalCollected);

      // Final Receivable Amount
      const finalReceivable = Math.max(0, remainingContract, cashDeficit);

      // Determine latest payment date
      let lastPaymentDate = null;
      if (projectRepaymentTransactions.length > 0) {
        const sortedTrx = [...projectRepaymentTransactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
        lastPaymentDate = sortedTrx[0].transactionDate;
      }

      const isOutOfPocket = cashDeficit > remainingContract;

      return {
        id: project.id,
        lender: project.customer?.name || 'Unknown Customer',
        lenderId: project.customerId,
        type: isOutOfPocket ? 'Project Out-of-Pocket' : 'Project Debt',
        amount: isOutOfPocket ? totalSpent : agreementAmount,
        paid: totalCollected,
        remaining: finalReceivable,
        issueDate: project.startDate || new Date().toISOString(),
        dueDate: project.endDate || new Date().toISOString(),
        status: finalReceivable <= 0 ? 'Paid' : (new Date(project.endDate || new Date()) < new Date() ? 'Overdue' : 'Active'),
        project: project.name,
        projectId: project.id,
        description: isOutOfPocket ? `Cash Deficit: Shirkadda ayaa bixisay ${totalSpent.toLocaleString()} halka macmiilku ka bixiyay ${totalCollected.toLocaleString()}` : `Project: ${project.name}`,
        account: 'Project Account',
        phoneNumber: project.customer?.phoneNumber || '',
        email: project.customer?.email || '',
        address: project.customer?.address || '',
        lastPaymentDate: lastPaymentDate,
        interestRate: null,
        paymentTerms: 'Project Agreement',
        notes: project.description || '',
        companyId: project.companyId,
        companyName: 'Current Company',
        // Project specific data
        projectStatus: project.status,
        projectValue: agreementAmount,
        customerId: project.customerId,
        customerName: project.customer?.name,
        isOutOfPocket
      };
    }); 

    // --- CONSOLIDATION & DEDUPLICATION (By Name + Project) ---
    // Use a map to ensure unique entries for Entity Name + Project pairs
    const finalPayablesMap: Record<string, any> = {};
    const finalReceivablesMap: Record<string, any> = {};

    const consolidate = (item: any, map: Record<string, any>, isPayable: boolean) => {
      const name = (item.lender || item.client || item.customerName || 'Unknown').trim();
      const projectKey = item.projectId || 'general';
      const key = `${name.toLowerCase()}_${projectKey}`;

      if (map[key]) {
        map[key].amount += (item.amount || 0);
        if (isPayable) {
          map[key].paid += (item.paid || 0);
        } else {
          map[key].received += (item.received || 0);
        }
        map[key].remaining = map[key].amount - (isPayable ? map[key].paid : map[key].received);
      } else {
        map[key] = { ...item };
        // Ensure consistent naming for the UI
        if (isPayable) {
          map[key].lender = name;
          map[key].paid = item.paid || 0;
        } else {
          map[key].client = name;
          map[key].received = item.received || 0;
        }
      }
    };

    processedVendorDebts.forEach(d => consolidate(d, d.isLiability ? finalPayablesMap : finalReceivablesMap, d.isLiability));
    processedCustomerReceivables.forEach(r => consolidate(r, r.isLiability ? finalPayablesMap : finalReceivablesMap, r.isLiability));

    const allPayablesItems = Object.values(finalPayablesMap).filter((i: any) => i.remaining > 0);
    const allReceivablesItems = [
      ...Object.values(finalReceivablesMap).filter((i: any) => i.remaining > 0),
      ...projectReceivablesData.map(p => ({ ...p, isLiability: false, isReceivable: true }))
    ];

    // Calculate aggregated statistics for the entire company
    const totalPayables = allPayablesItems.reduce((sum, item) => sum + item.remaining, 0);
    const overduePayables = allPayablesItems.filter(i => i.status === 'Overdue').reduce((sum, item) => sum + item.remaining, 0);
    
    const totalReceivables = allReceivablesItems.reduce((sum, item) => sum + item.remaining, 0);
    const overdueReceivables = allReceivablesItems.filter(i => i.status === 'Overdue').reduce((sum, item) => sum + item.remaining, 0);

    return NextResponse.json({
      success: true,
      companyId,
      summary: {
        // We use unified consistent keys for the summary
        totalDebtsRemaining: totalPayables, 
        overdueDebts: overduePayables,
        totalReceivablesRemaining: totalReceivables,
        overdueReceivables: overdueReceivables,
        // Keep these for backward compatibility if needed by other components
        totalPayables,
        totalReceivables
      },
      // Return lists that frontend expects but with consolidated data
      debts: [...allPayablesItems, ...allReceivablesItems], // All transaction-based items
      receivables: allReceivablesItems,
      companyDebts: allPayablesItems, 
      projectDebts: projectReceivablesData,
      clientReceivables: processedCustomerReceivables.filter(r => !r.isLiability),
      projectReceivables: processedCustomerReceivables.filter(r => !r.isLiability && r.projectId),
      allProjects: allProjects,
      allTransactions: allTransactions
    });
  } catch (error) {
    console.error('Debts API Error:', error);
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
