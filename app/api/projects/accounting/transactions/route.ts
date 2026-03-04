import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type
import { getSessionCompanyUser } from '@/lib/auth'; // Use central auth helper

// GET /api/projects/accounting/transactions - Soo deji dhammaan dhaqdhaqaaqa lacagta
export async function GET(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = sessionData.companyId;

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
      if (type && ['INCOME', 'EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'DEBT_RECEIVED', 'DEBT_REPAID', 'TRANSFER_IN', 'TRANSFER_OUT'].includes(type)) {
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
            { type: 'DEBT_REPAID' },
            { type: 'DEBT_RECEIVED' },
            { type: 'DEBT_GIVEN' }
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
            { type: 'DEBT_REPAID' },
            { type: 'DEBT_RECEIVED' },
            { type: 'DEBT_GIVEN' }
          ]
        };
      }
    }

    const [transactions, projectsWithAdvances] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          account: { select: { name: true } },
          project: { select: { name: true } },
          expense: { select: { description: true } },
          customer: { select: { name: true } },
          vendor: { select: { name: true } },
          user: { select: { fullName: true } },
          employee: { select: { fullName: true } },
        },
      }),
      prisma.project.findMany({
        where: {
          companyId,
          advancePaid: { gt: 0 }
        },
        include: {
          customer: { select: { name: true } }
        }
      })
    ]);

    // 1. Remove auto-generated "Advance Payment" duplicates from real transactions
    const filteredRealTransactions = transactions.filter(trx => {
      const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');
      return !(trx.type === 'INCOME' && isAutoAdvance);
    });

    // 2. Map real transactions
    const processedTransactions = filteredRealTransactions.map(trx => ({
      ...trx,
      amount: trx.amount instanceof Decimal ? trx.amount.toNumber() : trx.amount,
      isVirtual: false,
      // Source IDs for dynamic linking
      expenseId: trx.expenseId,
      customerId: trx.customerId,
      vendorId: trx.vendorId,
      fixedAssetId: trx.fixedAssetId,
      projectId: trx.projectId,
      employeeId: trx.employeeId
    }));

    // 3. Create virtual transactions from Projects
    const virtualTransactions: any[] = [];

    // Only include virtual project advances if we aren't specifically filtering for some other narrow type
    // (e.g. if type filter is EXPENSE, don't show project advances)
    if (!type || type === 'INCOME') {
      projectsWithAdvances.forEach(proj => {
        // If filtered by specific project, ensure it matches
        if (projectId && proj.id !== projectId) return;

        virtualTransactions.push({
          id: `virtual-proj-adv-${proj.id}`,
          description: `Advance Payment: ${proj.name}`,
          amount: proj.advancePaid instanceof Decimal ? proj.advancePaid.toNumber() : Number(proj.advancePaid),
          type: 'INCOME',
          category: 'Project Advance',
          transactionDate: proj.createdAt, // Or startDate if preferred
          note: 'System generated from Project Advance Paid',
          account: { name: 'System Managed (Advance)' },
          project: { name: proj.name },
          customer: proj.customer ? { name: proj.customer.name } : undefined,
          isVirtual: true,
          companyId: proj.companyId,
          projectId: proj.id,
          customerId: proj.customerId
        });
      });
    }

    // 4. Merge and sort
    const allTransactions = [...processedTransactions, ...virtualTransactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    // 5. Apply limit if provided (post-sort)
    const limitedTransactions = limit ? allTransactions.slice(0, parseInt(limit)) : allTransactions;

    return NextResponse.json({ transactions: limitedTransactions }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/projects/accounting/transactions - Ku dar dhaqdhaqaaq cusub
export async function POST(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId, userId } = sessionData;

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

    // Cusboonaysii balance-ka account-ka (Update account balance based on transaction history)
    const { recalculateAccountBalance } = await import('@/lib/accounting');

    // Recalculate for the primary account
    if (accountId) {
      await recalculateAccountBalance(accountId);
    }

    // Recalculate for transfer-related accounts
    if (type === 'TRANSFER_OUT' || type === 'TRANSFER_IN') {
      const payload = await request.clone().json();
      const otherAccountId = type === 'TRANSFER_OUT' ? payload.toAccountId : payload.fromAccountId;
      if (otherAccountId) {
        await recalculateAccountBalance(otherAccountId);
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

    // Update Expense Payment Status and send WhatsApp Receipt if applicable
    if (expenseId && type === 'DEBT_REPAID') {
      try {
        const expense = await prisma.expense.findFirst({ where: { id: expenseId } });
        if (expense) {
          // Calculate total amount paid for this expense
          const relatedTransactions = await prisma.transaction.findMany({
            where: {
              expenseId: expenseId,
              type: { in: ['EXPENSE', 'DEBT_REPAID'] }
            }
          });
          const totalPaid = relatedTransactions.reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);
          const expAmount = Number(expense.amount || 0);

          let newStatus = 'UNPAID';
          if (expAmount > 0 && totalPaid >= expAmount) {
            newStatus = 'PAID';
          } else if (totalPaid > 0 && totalPaid < expAmount) {
            newStatus = 'PARTIAL';
          }

          // Update expense status
          const updatedExpense = await prisma.expense.update({
            where: { id: expenseId },
            data: { paymentStatus: newStatus }
          });

          // Trigger WhatsApp receipt if vendor is linked
          if (vendorId) {
            const company = await prisma.company.findUnique({ where: { id: companyId } });
            const vendor = await prisma.shopVendor.findUnique({ where: { id: vendorId } });
            if (company && vendor?.phoneNumber) {
              const { sendReceiptViaWhatsApp } = await import('@/lib/whatsapp/send-receipt');
              const expenseWithVendor = { ...updatedExpense, vendor };
              console.log(`[Transaction API] Triggering WhatsApp receipt for expense ${expenseId} repayment to vendor ${vendor.name}`);
              sendReceiptViaWhatsApp(company.id, company.name, vendor.phoneNumber, expenseWithVendor);
            }
          }
        }
      } catch (expErr) {
        console.error('[Transaction API] Failed to update expense status or send receipt', expErr);
      }
    }

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
