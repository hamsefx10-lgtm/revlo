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

    // Group transactions by vendor for debts
    const vendorDebtMap: Record<string, any> = {};
    const customerReceivableMap: Record<string, any> = {};

    // Process transactions (only for the current company)
    allTransactions.forEach((transaction: any) => {
      const amount = Math.abs(Number(transaction.amount) || 0);

      // 1. Process Debts (Payables / Liability)
      // Includes anyone we OWE money to: Vendors by default, or Customers we took DEBT_RECEIVED from.
      const isLiabilityTransaction =
        (transaction.vendorId) ||
        (transaction.customerId && (transaction.type === 'DEBT_RECEIVED' || (transaction.type === 'DEBT_REPAID' && transaction.description?.toLowerCase().includes('amaah'))));

      if (isLiabilityTransaction && transaction.companyId === companyId) {
        const entityId = transaction.vendorId || transaction.customerId;
        const entityKey = `${entityId}_${transaction.companyId}`;

        if (!vendorDebtMap[entityKey]) {
          const isCustomer = !!transaction.customerId;
          vendorDebtMap[entityKey] = {
            id: entityId,
            lender: isCustomer ? (transaction.customer?.name || 'Unknown Client') : (transaction.vendor?.name || 'Unknown Vendor'),
            lenderId: entityId,
            isCustomerLender: isCustomer, // Track if lender is actually a customer
            companyId: transaction.companyId,
            companyName: transaction.company?.name || 'Unknown Company',
            type: transaction.description?.toLowerCase().includes('loan') ? 'Loan' :
              transaction.description?.toLowerCase().includes('equipment') ? 'Equipment Purchase' :
                transaction.description?.toLowerCase().includes('service') ? 'Service Payment' :
                  transaction.description?.toLowerCase().includes('investor') ? 'Investor Loan' :
                    transaction.description?.toLowerCase().includes('supplier') ? 'Supplier Credit' :
                      'Supplier Credit', // Default type
            amount: 0,
            paid: 0,
            remaining: 0,
            issueDate: transaction.transactionDate,
            dueDate: new Date(new Date(transaction.transactionDate).getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days from issue date
            status: 'Active',
            project: transaction.project?.name || '',
            projectId: transaction.projectId || '',
            description: transaction.description || '',
            account: transaction.account?.name || '',
            phoneNumber: (isCustomer ? transaction.customer?.phoneNumber : transaction.vendor?.phoneNumber) || '',
            email: (isCustomer ? transaction.customer?.email : transaction.vendor?.userId) || '',
            address: isCustomer ? (transaction.customer?.address || '') : '',
            isLiability: true,
            isReceivable: false,
            lastPaymentDate: null,
            interestRate: null,
            paymentTerms: 'Standard',
            notes: transaction.description || '',
            transactions: []
          };
        }

        if (transaction.type === 'DEBT_TAKEN' || transaction.type === 'DEBT_RECEIVED') {
          vendorDebtMap[entityKey].amount += amount;
        } else if (transaction.type === 'DEBT_REPAID') {
          vendorDebtMap[entityKey].paid += amount;
          vendorDebtMap[entityKey].lastPaymentDate = transaction.transactionDate;
        }

        vendorDebtMap[entityKey].transactions.push(transaction);

        // If this was a Customer lending us money, we've handled it in vendorDebtMap (Liability).
        // We should skip it in the customerReceivableMap to avoid double counting or confusing categorization.
        if (transaction.customerId && transaction.type === 'DEBT_RECEIVED') return;
      }

      // 2. Process Receivables (Assets)
      // Includes money OWDED TO US by Customers.
      if (transaction.customerId && transaction.customer && transaction.companyId === companyId) {
        const customerKey = `${transaction.customerId}_${transaction.companyId}`;
        const transactionDate = new Date(transaction.transactionDate);

        if (!customerReceivableMap[customerKey]) {
          customerReceivableMap[customerKey] = {
            id: transaction.customerId,
            client: transaction.customer.name || 'Unknown Client',
            clientId: transaction.customerId,
            companyId: transaction.companyId,
            companyName: transaction.company?.name || 'Unknown Company',
            project: transaction.project?.name || 'General',
            projectId: transaction.projectId || '',
            amount: 0,
            received: 0,
            remaining: 0,
            isLiability: false,
            isReceivable: true,
            issueDate: transactionDate,
            dueDate: new Date(transactionDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(), // 30 days from transaction date
            status: 'Upcoming',
            description: transaction.description || '',
            account: transaction.account?.name || '',
            phoneNumber: transaction.customer.phoneNumber || '',
            email: transaction.customer.email || '',
            address: transaction.customer.address || '',
            lastPaymentDate: null,
            paymentTerms: 'Standard',
            notes: transaction.description || '',
            projectStatus: transaction.project?.status || 'Active',
            projectValue: transaction.project?.budget ? Number(transaction.project.budget) : 0,
            transactions: []
          };
        }

        // Update issue date if this transaction is older
        if (transactionDate < new Date(customerReceivableMap[customerKey].issueDate || customerReceivableMap[customerKey].dueDate)) {
          customerReceivableMap[customerKey].issueDate = transactionDate;
          customerReceivableMap[customerKey].dueDate = new Date(transactionDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();
        }

        if (transaction.type === 'DEBT_TAKEN' || transaction.type === 'DEBT_GIVEN') {
          customerReceivableMap[customerKey].amount += amount;
        } else if (transaction.type === 'DEBT_REPAID') {
          customerReceivableMap[customerKey].received += amount;
          customerReceivableMap[customerKey].lastPaymentDate = transaction.transactionDate;
        }

        customerReceivableMap[customerKey].transactions.push(transaction);
      }
    });

    // Process expenses that might contain debt information
    allExpenses.forEach((expense: any) => {
      // Deduplicate: If this expense already has a matching transaction that was processed above, skip it.
      if (expenseTransactionMap.has(expense.id)) return;

      const amount = Math.abs(Number(expense.amount) || 0);

      // Check if this expense is related to debts
      const isDebtRelated = expense.category === 'Debt' ||
        expense.category === 'Debt Repayment' ||
        expense.description?.toLowerCase().includes('debt') ||
        expense.description?.toLowerCase().includes('loan') ||
        expense.description?.toLowerCase().includes('credit') ||
        expense.description?.toLowerCase().includes('deyn') ||
        expense.description?.toLowerCase().includes('qard') ||
        expense.description?.toLowerCase().includes('dayn') ||
        expense.description?.toLowerCase().includes('qardh');

      if (isDebtRelated && expense.vendorId && expense.companyId === companyId) {
        const vendorKey = `${expense.vendorId}_${expense.companyId}`;
        if (!vendorDebtMap[vendorKey]) {
          vendorDebtMap[vendorKey] = {
            id: expense.vendorId,
            lender: expense.vendor?.name || 'Unknown Vendor',
            lenderId: expense.vendorId,
            companyId: expense.companyId,
            companyName: expense.company?.name || 'Unknown Company',
            type: expense.category === 'Debt Repayment' ? 'Debt Repayment' : 'Expense Related Debt',
            amount: expense.category === 'Debt Repayment' ? 0 : amount,
            paid: expense.category === 'Debt Repayment' ? amount : 0,
            remaining: expense.category === 'Debt Repayment' ? 0 : amount,
            issueDate: expense.createdAt,
            dueDate: new Date(new Date(expense.createdAt).getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
            status: expense.category === 'Debt Repayment' ? 'Paid' : 'Active',
            project: expense.project?.name || '',
            projectId: expense.projectId || '',
            description: expense.description || '',
            account: 'Expense Account',
            phoneNumber: expense.vendor?.phoneNumber || '',
            email: '',
            address: '',
            lastPaymentDate: expense.category === 'Debt Repayment' ? expense.createdAt : null,
            interestRate: null,
            paymentTerms: 'Standard',
            notes: expense.description || '',
            transactions: [expense]
          };
        } else {
          // Add to existing debt
          if (expense.category === 'Debt Repayment') {
            vendorDebtMap[vendorKey].paid += amount;
            vendorDebtMap[vendorKey].remaining -= amount;
            vendorDebtMap[vendorKey].lastPaymentDate = expense.createdAt;
            if (vendorDebtMap[vendorKey].remaining <= 0) {
              vendorDebtMap[vendorKey].status = 'Paid';
            }
          } else {
            vendorDebtMap[vendorKey].amount += amount;
            vendorDebtMap[vendorKey].remaining += amount;
          }
          vendorDebtMap[vendorKey].transactions.push(expense);
        }
      }

      // Process customer receivables from expenses
      // Check if this is a customer debt expense (category 'Debt' OR 'Company Expense' with subCategory 'Debt')
      const isCustomerDebtExpense = (expense.category === 'Debt' ||
        (expense.category === 'Company Expense' && expense.subCategory === 'Debt')) &&
        expense.customerId &&
        expense.customer &&
        expense.companyId === companyId;

      // Also check if expense has description indicating debt to customer
      const hasDebtDescription = expense.description?.toLowerCase().includes('debt') ||
        expense.description?.toLowerCase().includes('loan') ||
        expense.description?.toLowerCase().includes('deyn') ||
        expense.description?.toLowerCase().includes('qard') ||
        expense.description?.toLowerCase().includes('dayn') ||
        expense.description?.toLowerCase().includes('qardh') ||
        expense.description?.toLowerCase().includes('loo diray') ||
        expense.description?.toLowerCase().includes('lo diray');

      if ((isCustomerDebtExpense || (isDebtRelated && hasDebtDescription)) &&
        expense.customerId &&
        expense.customer &&
        expense.companyId === companyId) {
        const customerKey = `${expense.customerId}_${expense.companyId}`;
        const expenseAmount = Math.abs(amount); // Use absolute value for debt amount

        // Check if this expense already has a transaction (to avoid double counting)
        const hasTransaction = expenseTransactionMap.has(expense.id);

        // Only process if expense doesn't already have a transaction (to avoid double counting)
        if (!hasTransaction) {
          if (!customerReceivableMap[customerKey]) {
            // Create new receivable entry from expense
            const expenseDate = new Date(expense.expenseDate || expense.createdAt);
            customerReceivableMap[customerKey] = {
              id: expense.customerId,
              client: expense.customer.name || 'Unknown Client',
              clientId: expense.customerId,
              companyId: expense.companyId,
              companyName: expense.company?.name || 'Unknown Company',
              project: expense.project?.name || 'General',
              projectId: expense.projectId || '',
              amount: expense.category === 'Debt Repayment' ? 0 : expenseAmount,
              received: expense.category === 'Debt Repayment' ? expenseAmount : 0,
              remaining: expense.category === 'Debt Repayment' ? 0 : expenseAmount,
              issueDate: expenseDate,
              dueDate: new Date(expenseDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString(),
              status: expense.category === 'Debt Repayment' ? 'Paid' : 'Upcoming',
              description: expense.description || '',
              account: expense.paidFrom ? 'Account' : 'Expense Account',
              phoneNumber: expense.customer.phoneNumber || '',
              email: expense.customer.email || '',
              address: expense.customer.address || '',
              lastPaymentDate: expense.category === 'Debt Repayment' ? expenseDate : null,
              paymentTerms: 'Standard',
              notes: expense.description || '',
              projectStatus: expense.project?.status || 'Active',
              projectValue: expense.project?.budget ? Number(expense.project.budget) : 0,
              transactions: [expense]
            };
          } else {
            // Add to existing receivable
            if (expense.category === 'Debt Repayment') {
              customerReceivableMap[customerKey].received += expenseAmount;
              customerReceivableMap[customerKey].remaining = Math.max(0, customerReceivableMap[customerKey].remaining - expenseAmount);
              const expenseDate = new Date(expense.expenseDate || expense.createdAt);
              customerReceivableMap[customerKey].lastPaymentDate = expenseDate;
              if (customerReceivableMap[customerKey].remaining <= 0) {
                customerReceivableMap[customerKey].status = 'Paid';
              }
            } else {
              // This is a new debt (DEBT_TAKEN equivalent)
              customerReceivableMap[customerKey].amount += expenseAmount;
              customerReceivableMap[customerKey].remaining += expenseAmount;

              // Update issue date to earliest expense date (if this expense is older)
              const expenseDate = new Date(expense.expenseDate || expense.createdAt);
              const currentIssueDate = customerReceivableMap[customerKey].issueDate
                ? new Date(customerReceivableMap[customerKey].issueDate)
                : new Date(customerReceivableMap[customerKey].dueDate);

              if (expenseDate < currentIssueDate) {
                customerReceivableMap[customerKey].issueDate = expense.expenseDate || expense.createdAt;
                customerReceivableMap[customerKey].dueDate = new Date(expenseDate.getTime() + (30 * 24 * 60 * 60 * 1000)).toISOString();
              }
            }
            customerReceivableMap[customerKey].transactions.push(expense);
          }
        }
      }
    });

    // Calculate remaining amounts and status for debts
    const debts = Object.values(vendorDebtMap).map((debt: any) => {
      // If payment exceeds recorded debt (e.g., historical unrecorded expenses), 
      // bump up the total amount to match the payment to avoid negative remaining debts.
      if (debt.paid > debt.amount) {
        debt.amount = debt.paid;
      }
      debt.remaining = debt.amount - debt.paid;

      // Determine status
      if (debt.remaining <= 0) {
        debt.status = 'Paid';
      } else {
        const dueDate = new Date(debt.dueDate);
        const today = new Date();
        if (dueDate < today) {
          debt.status = 'Overdue';
        } else {
          debt.status = 'Active';
        }
      }

      return debt;
    });

    // Calculate remaining amounts and status for receivables
    const receivables = Object.values(customerReceivableMap).map((receivable: any) => {
      // Recalculate remaining to ensure accuracy
      receivable.remaining = receivable.amount - receivable.received;

      // Determine status based on remaining amount and due date
      if (receivable.remaining <= 0) {
        receivable.status = 'Paid';
      } else {
        const dueDate = new Date(receivable.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to compare dates only

        if (dueDate < today) {
          receivable.status = 'Overdue';
        } else {
          receivable.status = 'Upcoming';
        }
      }

      return receivable;
    });

    // Process project debts - projects that owe money
    const projectDebts = allProjects.map((project: any) => {
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

      const totalDebtAmount = projectDebtTransactions.reduce((sum: number, trx: any) => sum + Math.abs(Number(trx.amount)), 0);
      const totalRepaidAmount = projectRepaymentTransactions.reduce((sum: number, trx: any) => sum + Math.abs(Number(trx.amount)), 0);

      // Total Paid = Initial Advance (Static Field) + Other Transactions
      const totalPaid = advancePaid + totalRepaidAmount;
      const remainingAmount = agreementAmount - totalPaid;

      // Determine latest payment date
      let lastPaymentDate = null;
      if (projectRepaymentTransactions.length > 0) {
        // Sort by date desc to get latest
        const sortedTrx = [...projectRepaymentTransactions].sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
        lastPaymentDate = sortedTrx[0].transactionDate;
      }

      return {
        id: project.id,
        lender: project.customer?.name || 'Unknown Customer',
        lenderId: project.customerId,
        type: 'Project Debt',
        amount: agreementAmount,
        paid: totalPaid,
        remaining: remainingAmount,
        issueDate: project.startDate || new Date().toISOString(),
        dueDate: project.endDate || new Date().toISOString(),
        status: remainingAmount <= 0 ? 'Paid' : (new Date(project.endDate || new Date()) < new Date() ? 'Overdue' : 'Active'),
        project: project.name,
        projectId: project.id,
        description: `Project: ${project.name}`,
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
        customerName: project.customer?.name
      };
    }); // Return all projects, even fully paid or overpaid

    // For the UI Summary "Wadarta Payables" (Total Debts Owed by Company), it must ONLY include Vendor Debts
    // Project Debts represent money owed TO the company (by customers), not BY the company.
    // The "allDebts" concatenated array continues to serve other unified views if needed, 
    // but the summary relies STRICTLY on 'debts'.
    const allDebts = [...debts, ...projectDebts];

    // Calculate summary statistics purely off vendor debts for "Wadarta Payables"
    const totalDebtsOwed = debts.reduce((sum: number, debt: any) => sum + debt.amount, 0);
    const totalDebtsPaid = debts.reduce((sum: number, debt: any) => sum + debt.paid, 0);
    const totalDebtsRemaining = debts.reduce((sum: number, debt: any) => sum + debt.remaining, 0);
    const overdueDebts = debts.filter((debt: any) => debt.status === 'Overdue').reduce((sum: number, debt: any) => sum + debt.remaining, 0);

    const totalReceivablesAmount = receivables.reduce((sum: number, rec: any) => sum + rec.amount, 0);
    const totalReceivablesReceived = receivables.reduce((sum: number, rec: any) => sum + rec.received, 0);
    const totalReceivablesRemaining = receivables.reduce((sum: number, rec: any) => sum + rec.remaining, 0);
    const overdueReceivables = receivables.filter((rec: any) => rec.status === 'Overdue').reduce((sum: number, rec: any) => sum + rec.remaining, 0);

    return NextResponse.json({
      success: true,
      companyId,
      summary: {
        totalDebtsOwed,
        totalDebtsPaid,
        totalDebtsRemaining,
        overdueDebts,
        totalReceivablesAmount,
        totalReceivablesReceived,
        totalReceivablesRemaining,
        overdueReceivables
      },
      debts: allDebts,
      receivables,
      // Separate project and company debts
      companyDebts: debts, // Original vendor debts
      projectDebts: projectDebts, // Project-specific debts
      clientReceivables: receivables,
      projectReceivables: receivables.filter((rec: any) => rec.projectId),
      // Additional data
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
