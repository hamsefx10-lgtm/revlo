// app/api/customers/[id]/route.ts - Single Customer Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { isValidEmail } from '@/lib/utils'; // For email validation
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants

// GET /api/customers/[id] - Soo deji macmiil gaar ah
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    const companyId = 'default-company'; // Temporary for development

    // Hel customer iyo xogaha la xiriira
    const customer = await prisma.customer.findUnique({
      where: { id: id },
      include: {
        projects: {
          select: { id: true, name: true, status: true, agreementAmount: true, advancePaid: true, remainingAmount: true }
        },
        payments: {
          select: { id: true, amount: true, paymentDate: true, paymentType: true, receivedIn: true, projectId: true }
        },
        transactions: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ message: 'Macmiilka lama helin.' }, { status: 404 });
    }

    // Xisaabi total outstanding debt (expenses/transactions oo aan la bixin)
    // 1. Expenses uu macmiilkan leeyahay oo aan la bixin (category/subCategory = Debt, Debt Repayment, iwm)
    // Waxaa lagu daray: expenses uu customerId si toos ah ugu lifaaqan yahay (company debt)
    // Project-related expenses
    const projectExpenses = await prisma.expense.findMany({
      where: {
        project: { customerId: id },
      },
      select: {
        id: true,
        amount: true,
        category: true,
        subCategory: true,
        paidFrom: true,
        expenseDate: true,
        note: true,
        projectId: true,
        project: { select: { name: true } },
        receiptUrl: true
      },
    });

    // Company debt/repayment (Debt/Debt Repayment, projectId is null, and project.customerId is not available)
    // Waa in la xigtaa expenses-ka category-gaas leh oo projectId=null, kadibna la xigtaa projectId iyo project.customerId
    const companyDebts = await prisma.expense.findMany({
      where: {
        category: 'Company Expense',
        subCategory: { in: ['Debt', 'Debt Repayment'] },
        projectId: null,
        customerId: id,
      },
      select: {
        id: true,
        amount: true,
        category: true,
        subCategory: true,
        paidFrom: true,
        expenseDate: true,
        note: true,
        projectId: true,
        project: { select: { name: true } },
        receiptUrl: true
      },
    });

    // Isku dar labada array
    const expenses = [...projectExpenses, ...companyDebts];

    // 2. Transactions uu macmiilkan leeyahay (type = DEBT_TAKEN, DEBT_REPAID, INCOME, EXPENSE, iwm)
    const transactions = await prisma.transaction.findMany({
      where: { customerId: id },
      select: {
        id: true,
        description: true,
        amount: true,
        type: true,
        transactionDate: true,
        note: true,
        projectId: true,
        project: { select: { name: true } },
        account: { select: { name: true } },
      },
      orderBy: { transactionDate: 'desc' },
    });

    // 3. Xisaabi total outstanding debt (expenses - repayments)
    let outstandingDebt = 0;
    
    // Calculate debt from expenses (Company Debt only)
    for (const exp of expenses) {
      // Only count Company Expense category with Debt subcategory
      if (exp.category === 'Company Expense' && exp.subCategory === 'Debt') {
        outstandingDebt += Number(exp.amount);
      }
    }
    
    // Calculate repayments from transactions (more accurate and real-time)
    for (const trx of transactions) {
      if (trx.type === 'DEBT_TAKEN') {
        outstandingDebt += Number(trx.amount);
      }
      if (trx.type === 'DEBT_REPAID') {
        outstandingDebt -= Number(trx.amount); // DEBT_REPAID is now stored as positive
      }
      // Only count INCOME transactions that are not project-related as debt repayment
      if (trx.type === 'INCOME' && !trx.projectId) {
        outstandingDebt -= Number(trx.amount); // Only non-project INCOME reduces company debt
      }
    }
    
    // Ensure outstanding debt is not negative (customer can't owe negative amount)
    outstandingDebt = Math.max(0, outstandingDebt);

    // Debug information
    console.log('Customer Debt Debug:', {
      customerId: id,
      customerName: customer.name,
      outstandingDebt,
      expenses: expenses.filter(exp => exp.category === 'Company Expense' && exp.subCategory === 'Debt'),
  debtTransactions: transactions.filter((trx: any) => trx.type === 'DEBT_TAKEN' || trx.type === 'DEBT_REPAID'),
  incomeTransactions: transactions.filter((trx: any) => trx.type === 'INCOME' && !trx.projectId)
    });

    // 4. Projects uu leeyahay iyo lacagta ku dhiman (using accounting transactions)
  const projectDebts = (customer.projects || []).map((proj: any) => {
      const agreement = Number(proj.agreementAmount || 0);
      
      // Calculate total payments from accounting transactions for this project
  const projectTransactions = transactions.filter((trx: any) => 
        trx.projectId === proj.id && 
        (trx.type === 'INCOME' || trx.type === 'DEBT_REPAID')
      );
      
      const totalPaidFromTransactions = projectTransactions.reduce((sum: number, trx: any) => 
        sum + Math.abs(Number(trx.amount)), 0
      );
      
      // Use the higher of database advancePaid or calculated from transactions
      const advance = Math.max(Number(proj.advancePaid || 0), totalPaidFromTransactions);
      const remaining = Math.max(0, agreement - advance);
      
      return {
        id: proj.id,
        name: proj.name,
        status: proj.status,
        agreementAmount: agreement,
        advancePaid: advance,
        remainingAmount: remaining,
        transactionCount: projectTransactions.length
      };
    });

    // 4b. Update project balances in database if there are discrepancies
    for (const proj of customer.projects || []) {
  const projectDebt = projectDebts.find((pd: any) => pd.id === proj.id);
      if (projectDebt && Math.abs(Number(proj.remainingAmount) - projectDebt.remainingAmount) > 0.01) {
        await prisma.project.update({
          where: { id: proj.id },
          data: {
            advancePaid: projectDebt.advancePaid,
            remainingAmount: projectDebt.remainingAmount
          }
        });
      }
    }

    // 5. Payments uu bixiyay (lacagaha la helay)
  const payments = customer.payments.map((pay: any) => ({
      ...pay,
      amount: Number(pay.amount),
    }));

    // 6. Transactions uu leeyahay (already fetched)

    // 7. Expenses uu leeyahay (already fetched)
    
    // 8. Fetch account information for all unique account IDs
    const accountIds = [...new Set(expenses.map(exp => exp.paidFrom).filter(Boolean))];
    const accounts = await prisma.account.findMany({
      where: { id: { in: accountIds } },
      select: { id: true, name: true },
    });
    
    // Create a map for quick lookup
  const accountMap = new Map(accounts.map((acc: any) => [acc.id, acc.name]));

    // 9. Map expenses with account names
    const expensesWithAccountNames = expenses.map(exp => ({
      ...exp,
      accountName: accountMap.get(exp.paidFrom) || exp.paidFrom,
    }));

    // 10. Return all data
    return NextResponse.json({
      customer: {
        ...customer,
        outstandingDebt,
        projectDebts,
        payments,
        transactions,
        expenses: expensesWithAccountNames,
      },
    }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka macmiilka ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Cusboonaysii macmiil gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { 
      name, type, companyName, phone, email, address, notes
    } = await request.json();

    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || (!isManagerOrAdmin(session.user.role) && session.user.role !== USER_ROLES.MEMBER)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // 1. Xaqiijinta Input-ka
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca.' },
        { status: 400 }
      );
    }
    if (type === 'Company' && !companyName) {
      return NextResponse.json(
        { message: 'Magaca shirkadda waa waajib haddii nooca uu yahay "Company".' },
        { status: 400 }
      );
    }
    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Fadlan geli email sax ah.' },
        { status: 400 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: id },
      // and: { companyId: companyId } // Mustaqbalka, ku dar filter-kan
      data: {
        name,
        type,
        companyName: companyName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(
      { message: 'Macmiilka si guul leh ayaa loo cusboonaysiiyay!', customer: updatedCustomer },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka macmiilka ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Tirtir macmiil gaar ah
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || !isAdmin(session.user.role)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // Hubi in macmiilku jiro ka hor inta aan la tirtirin
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: id },
      // and: { companyId: companyId } // Mustaqbalka, ku dar filter-kan
    });

    if (!existingCustomer) {
      return NextResponse.json({ message: 'Macmiilka lama helin.' }, { status: 404 });
    }

    // Tirtir macmiilka
    await prisma.customer.delete({
      where: { id: id },
    });

    return NextResponse.json(
      { message: 'Macmiilka si guul leh ayaa loo tirtiray!' },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka macmiilka ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}