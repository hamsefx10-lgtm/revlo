// app/api/accounting/transactions/route.ts - Accounting Transactions API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/accounting/transactions - Soo deji dhammaan dhaqdhaqaaqa lacagta
export async function GET(request: Request) {
  try {
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const type = searchParams.get('type');
    const id = searchParams.get('id'); // Support direct ID fetch
    const includeDebts = searchParams.get('includeDebts') === 'true';
    const includeProjectDebts = searchParams.get('includeProjectDebts') === 'true';
    const projectId = searchParams.get('projectId');

    // Build where clause
    let whereClause: any = { companyId };

    // If specific ID is requested, ignore other filters
    if (id) {
      whereClause.id = id;
    } else {
      // Only apply other filters if ID is not provided

      // Add type filter if specified
      if (type && ['INCOME', 'EXPENSE', 'DEBT_TAKEN', 'DEBT_REPAID', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(type)) {
        whereClause.type = type;
      }

      // Add project filter if specified
      if (projectId) {
        whereClause.projectId = projectId;
      }

      // If includeDebts is true, prioritize debt transactions
      if (includeDebts) {
        whereClause = {
          companyId,
          OR: [
            { type: 'DEBT_TAKEN' },
            { type: 'DEBT_REPAID' }
          ]
        };
        if (projectId) {
          whereClause.projectId = projectId;
        }
      }

      // If includeProjectDebts is true, get debt transactions linked to projects
      if (includeProjectDebts) {
        whereClause = {
          companyId,
          projectId: { not: null }, // Only transactions with projects
          OR: [
            { type: 'DEBT_TAKEN' },
            { type: 'DEBT_REPAID' }
          ]
        };
      }
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        account: { select: { name: true } },
        project: { select: { name: true } },
        expense: { select: { description: true } },
        customer: { select: { name: true } },
        // vendor: { select: { name: true } },
        user: { select: { fullName: true } },
        employee: { select: { fullName: true } },
      },
      orderBy: {
        transactionDate: 'desc',
      },
      ...(limit && { take: parseInt(limit) }),
    });

    const processedTransactions = transactions.map(trx => ({
      ...trx,
      amount: trx.amount instanceof Decimal ? trx.amount.toNumber() : trx.amount,
    }));

    return NextResponse.json({ transactions: processedTransactions }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/accounting/transactions - Ku dar dhaqdhaqaaq cusub
export async function POST(request: Request) {
  try {
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId || !(session as any).user?.id) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;
    const userId = (session as any).user.id;

    const {
      description, amount, type, transactionDate, note,
      accountId, // Account ID
      projectId, expenseId, customerId, vendorId, employeeId
    } = await request.json();

    if (!description || typeof amount !== 'number' || !type || !transactionDate) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Sharaxaad, Qiime, Nooc, Taariikhda.' },
        { status: 400 }
      );
    }
    if (amount === 0) {
      return NextResponse.json(
        { message: 'Qiimaha ma noqon karo eber.' },
        { status: 400 }
      );
    }

    // Xaqiijinta Account-ka
    if (!accountId) {
      return NextResponse.json(
        { message: 'Account-ka waa waajib.' },
        { status: 400 }
      );
    }

    // Hubi jiritaanka account-ka shirkaddan
    const primaryAccount = await prisma.account.findFirst({ where: { id: accountId, companyId } });
    if (!primaryAccount) return NextResponse.json({ message: 'Account-ka lama helin.' }, { status: 400 });

    // Hubi jiritaanka entities-ka shirkaddan
    if (projectId) {
      const project = await prisma.project.findFirst({ where: { id: projectId, companyId } });
      if (!project) return NextResponse.json({ message: 'Mashruuca la xiriira lama helin.' }, { status: 400 });
    }
    if (expenseId) {
      const expense = await prisma.expense.findFirst({ where: { id: expenseId, companyId } });
      if (!expense) return NextResponse.json({ message: 'Kharashka la xiriira lama helin.' }, { status: 400 });
    }
    if (customerId) {
      const customer = await prisma.customer.findFirst({ where: { id: customerId, companyId } });
      if (!customer) return NextResponse.json({ message: 'Macmiilka la xiriira lama helin.' }, { status: 400 });
    }
    if (vendorId) {
      const vendor = await prisma.shopVendor.findFirst({ where: { id: vendorId, companyId } });
      if (!vendor) return NextResponse.json({ message: 'Iibiyaha la xiriira lama helin.' }, { status: 400 });
    }
    if (employeeId) {
      const employee = await prisma.employee.findFirst({ where: { id: employeeId, companyId } });
      if (!employee) return NextResponse.json({ message: 'Shaqaalaha la xiriira lama helin.' }, { status: 400 });
    }

    // Abuur dhaqdhaqaaq cusub
    const newTransaction = await prisma.transaction.create({
      data: {
        description,
        amount: new Decimal(amount),
        type,
        transactionDate: new Date(transactionDate),
        note: note || null,
        accountId: accountId,
        projectId: projectId || null,
        expenseId: expenseId || null,
        customerId: customerId || null,
        vendorId: vendorId || null,
        employeeId: employeeId || null,
        userId,
        companyId,
      },
    });

    // Cusboonaysii balance-ka account-ka (Update account balance based on transaction type)
    // 
    // Accounting Logic:
    // - INCOME: Money coming IN from customer → Balance INCREASES
    // - DEBT_REPAID: Customer paying back their debt → Balance INCREASES
    // - DEBT_TAKEN: Company taking a loan (money received) → Balance INCREASES
    // - EXPENSE: Money going OUT for expenses → Balance DECREASES
    //
    // Accounting Logic Refined:

    // 1. INCOME: Money IN from Sales/Deposits -> INCREASES Balance
    if (type === 'INCOME') {
      await prisma.account.update({
        where: { id: primaryAccount.id },
        data: { balance: primaryAccount.balance + Math.abs(amount) },
      });
    }

    // 2. EXPENSE: Money OUT for Costs -> DECREASES Balance
    else if (type === 'EXPENSE') {
      await prisma.account.update({
        where: { id: primaryAccount.id },
        data: { balance: primaryAccount.balance - Math.abs(amount) },
      });
    }

    // 3. DEBT_TAKEN: Money Received (Loan) -> INCREASES Balance
    else if (type === 'DEBT_TAKEN') {
      await prisma.account.update({
        where: { id: primaryAccount.id },
        data: { balance: primaryAccount.balance + Math.abs(amount) },
      });
    }

    // 4. DEBT_REPAID: Complexity here (Money IN or OUT?)
    // 4. DEBT_REPAID: Complexity here (Money IN or OUT?)
    // Logic: 
    // - If linked to Vendor -> We are paying back debt -> MONEY OUT
    // - If linked to Customer/Project -> They are paying us back -> MONEY IN
    // - If type was explicitly sent as MONEY_OUT (from frontend modal) -> MONEY OUT

    // However, the frontend sends `type: 'MONEY_OUT'` in the payload for vendor payment.
    // But the Prisma schema expects `TransactionType` enum values. 
    // The current frontend code sends `type: 'MONEY_OUT'` which might be failing validation if not mapped.
    // Let's check the schema. TransactionType enum usually has specific values.
    // The frontend actually sends `{..., type: 'MONEY_OUT'}` in VendorPaymentModal.
    // If the valid types are EXPENSE, DEBT_REPAID etc, we need to map it or trust the frontend to send DEBT_REPAID.
    // Wait, the modal says `type: 'MONEY_OUT'`. Prisma likely rejects this if it's not in enum.
    // We should fix the Modal to send `DEBT_REPAID` and handle it here.

    // Back to API logic for DEBT_REPAID:
    else if (type === 'DEBT_REPAID') {
      if (vendorId) {
        // Paying Vendor -> Decrease Balance
        await prisma.account.update({
          where: { id: primaryAccount.id },
          data: { balance: { decrement: Math.abs(amount) } },
        });
      } else {
        // Collecting from Customer/Project -> Increase Balance
        await prisma.account.update({
          where: { id: primaryAccount.id },
          data: { balance: { increment: Math.abs(amount) } },
        });
      }
    }

    // Notify about transaction creation for real-time updates
    const transactionEvent = {
      id: newTransaction.id,
      projectId: projectId || null,
      customerId: customerId || null,
      action: 'created',
      timestamp: Date.now()
    };

    return NextResponse.json(
      { message: 'Dhaqdhaqaaqa lacagta si guul leh ayaa loo daray!', transaction: newTransaction, event: transactionEvent },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta la darayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
