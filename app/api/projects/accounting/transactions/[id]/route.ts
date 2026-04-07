// app/api/projects/accounting/transactions/[id]/route.ts - Single Accounting Transaction Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/projects/accounting/transactions/[id] - Soo deji dhaqdhaqaaq gaar ah

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    // const companyId = session.user.companyId;

    const transaction = await prisma.transaction.findUnique({
      where: { id: id },
      // and: { companyId: companyId } // Mustaqbalka, ku dar filter-kan
      include: {
        account: { select: { id: true, name: true } }, // Include ID for frontend forms
        fromAccount: { select: { id: true, name: true } }, // Include ID
        toAccount: { select: { id: true, name: true } },   // Include ID
        project: { select: { id: true, name: true } },     // Include ID
        expense: { select: { id: true, description: true } }, // Include ID
        customer: { select: { id: true, name: true } },    // Include ID
        // vendor: { select: { id: true, name: true } },      // Include ID
        user: { select: { id: true, fullName: true } },    // Include ID
        employee: { select: { id: true, fullName: true } }, // Include ID
      },
    });

    if (!transaction) {
      return NextResponse.json({ message: 'Dhaqdhaqaaqa lama helin.' }, { status: 404 });
    }

    // Convert Decimal fields to Number for frontend display
    const processedTransaction = {
      ...transaction,
      amount: transaction.amount.toNumber(),
    };

    return NextResponse.json({ transaction: processedTransaction }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka dhaqdhaqaaqa ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/accounting/transactions/[id] - Cusboonaysii dhaqdhaqaaq gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const {
      description, amount, type, transactionDate, note,
      accountId, fromAccountId, toAccountId, // Account IDs
      projectId, expenseId, customerId, vendorId, employeeId // Related entity IDs
    } = await request.json();

    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || (!isManagerOrAdmin(session.user.role) && session.user.role !== USER_ROLES.MEMBER)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // 1. Xaqiijinta Input-ka
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

    // Xaqiijinta Account-yada
    if (type !== 'TRANSFER_IN' && type !== 'TRANSFER_OUT' && !accountId) {
      return NextResponse.json(
        { message: 'Account-ka waa waajib dhaqdhaqaaqyada aan wareejinta ahayn.' },
        { status: 400 }
      );
    }
    if ((type === 'TRANSFER_IN' || type === 'TRANSFER_OUT') && (!fromAccountId || !toAccountId)) {
      return NextResponse.json(
        { message: 'Accounts-ka laga wareejinayo iyo loo wareejinayo waa waajib wareejinta.' },
        { status: 400 }
      );
    }
    if (fromAccountId === toAccountId && (type === 'TRANSFER_IN' || type === 'TRANSFER_OUT')) {
      return NextResponse.json(
        { message: 'Accounts-ka wareejinta ma noqon karaan isku mid.' },
        { status: 400 }
      );
    }

    // Hubi jiritaanka accounts-ka
    let primaryAccount = null;
    let sourceAccount = null;
    let destinationAccount = null;

    if (accountId) {
      primaryAccount = await prisma.account.findUnique({ where: { id: accountId } });
      if (!primaryAccount) return NextResponse.json({ message: 'Account-ka aasaasiga ah lama helin.' }, { status: 400 });
    }
    if (fromAccountId) {
      sourceAccount = await prisma.account.findUnique({ where: { id: fromAccountId } });
      if (!sourceAccount) return NextResponse.json({ message: 'Account-ka laga wareejinayo lama helin.' }, { status: 400 });
    }
    if (toAccountId) {
      destinationAccount = await prisma.account.findUnique({ where: { id: toAccountId } });
      if (!destinationAccount) return NextResponse.json({ message: 'Account-ka loo wareejinayo lama helen.' }, { status: 400 });
    }

    // Hubi jiritaanka entities-ka la xiriira
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return NextResponse.json({ message: 'Mashruuca la xiriira lama helin.' }, { status: 400 });
    }
    if (expenseId) {
      const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
      if (!expense) return NextResponse.json({ message: 'Kharashka la xiriira lama helin.' }, { status: 400 });
    }
    if (customerId) {
      const customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) return NextResponse.json({ message: 'Macmiilka la xiriira lama helin.' }, { status: 400 });
    }
    /* if (vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (!vendor) return NextResponse.json({ message: 'Iibiyaha la xiriira lama helin.' }, { status: 400 });
    } */
    if (employeeId) {
      const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
      if (!employee) return NextResponse.json({ message: 'Shaqaalaha la xiriira lama helin.' }, { status: 400 });
    }

    // Capture OLD accounts BEFORE update
    const oldTrx = await prisma.transaction.findUnique({ where: { id } });

    // Cusboonaysii dhaqdhaqaaq cusub
    const updatedTransaction = await prisma.transaction.update({
      where: { id: id },
      data: {
        description,
        amount: new Decimal(amount), // Convert to Decimal
        type,
        transactionDate: new Date(transactionDate),
        note: note || null,
        accountId: accountId || null,
        fromAccountId: fromAccountId || null,
        toAccountId: toAccountId || null,
        projectId: projectId || null,
        expenseId: expenseId || null,
        customerId: customerId || null,
        vendorId: vendorId || null,
        employeeId: employeeId || null,
        // userId: currentUserId, // Mustaqbalka, ka hel session-ka
        // companyId: currentCompanyId, // Mustaqbalka, ka hel session-ka
      },
    });

    // Cusboonaysii balance-ka accounts-ka
    const { recalculateAccountBalance } = await import('@/lib/accounting');

    // Collect all unique account IDs that might be affected
    const affectedAccountIds = new Set<string>();
    if (accountId) affectedAccountIds.add(accountId);
    if (fromAccountId) affectedAccountIds.add(fromAccountId);
    if (toAccountId) affectedAccountIds.add(toAccountId);

    // Also consider the OLD accounts before update
    if (oldTrx) {
      if (oldTrx.accountId) affectedAccountIds.add(oldTrx.accountId);
      if (oldTrx.fromAccountId) affectedAccountIds.add(oldTrx.fromAccountId);
      if (oldTrx.toAccountId) affectedAccountIds.add(oldTrx.toAccountId);
    }

    // Recalculate everyone
    for (const accId of affectedAccountIds) {
      await recalculateAccountBalance(accId);
    }

    // Capture expense ID to update status if needed
    if (updatedTransaction.expenseId) {
      const { updateExpenseStatus, updateProjectAdvancePaid, updateEmployeeSalaryStats } = await import('@/lib/accounting');
      await updateExpenseStatus(updatedTransaction.expenseId);
      if (updatedTransaction.projectId) await updateProjectAdvancePaid(updatedTransaction.projectId);
      if (updatedTransaction.employeeId) await updateEmployeeSalaryStats(updatedTransaction.employeeId);
    }
    // Also consider the OLD expense/project/employee if they changed
    if (oldTrx) {
       const { updateExpenseStatus, updateProjectAdvancePaid, updateEmployeeSalaryStats } = await import('@/lib/accounting');
       if (oldTrx.expenseId && oldTrx.expenseId !== updatedTransaction.expenseId) await updateExpenseStatus(oldTrx.expenseId);
       if (oldTrx.projectId && oldTrx.projectId !== updatedTransaction.projectId) await updateProjectAdvancePaid(oldTrx.projectId);
       if (oldTrx.employeeId && oldTrx.employeeId !== updatedTransaction.employeeId) await updateEmployeeSalaryStats(oldTrx.employeeId);
    }

    return NextResponse.json(
      { message: 'Dhaqdhaqaaqa lacagta si guul leh ayaa loo cusboonaysiiyay!', transaction: updatedTransaction },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/accounting/transactions/[id] - Tirtir dhaqdhaqaaq gaar ah
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Mustaqbalka, halkan waxaad ku dari doontaa authentication iyo authorization
    // Tusaale: const session = await getServerSession(authOptions);
    // if (!session || (!isManagerOrAdmin(session.user.role) && session.user.role !== USER_ROLES.MEMBER)) return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 403 });
    // const companyId = session.user.companyId;

    // Hubi in dhaqdhaqaaqu jiro ka hor inta aan la tirtirin
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: id },
      // and: { companyId: companyId } // Mustaqbalka, ku dar filter-kan
    });

    if (!existingTransaction) {
      return NextResponse.json({ message: 'Dhaqdhaqaaqa lama helin.' }, { status: 404 });
    }

    // Tirtir dhaqdhaqaaqa
    let affectedAccountIds = new Set<string>();
    if (existingTransaction.accountId) affectedAccountIds.add(existingTransaction.accountId);
    if (existingTransaction.fromAccountId) affectedAccountIds.add(existingTransaction.fromAccountId);
    if (existingTransaction.toAccountId) affectedAccountIds.add(existingTransaction.toAccountId);

    // Hubi haddii ay tahay wareejin (Internal Transfer) oo u baahan in laga tirtiro labada dhinac
    if (existingTransaction.type === 'TRANSFER_IN' || existingTransaction.type === 'TRANSFER_OUT') {
      // Raadi transaction-ka mataanka ah (the twin leg)
      const oppositeType = existingTransaction.type === 'TRANSFER_IN' ? 'TRANSFER_OUT' : 'TRANSFER_IN';
      
      const twinTransaction = await prisma.transaction.findFirst({
        where: {
          companyId: existingTransaction.companyId,
          type: oppositeType,
          amount: existingTransaction.amount,
          transactionDate: existingTransaction.transactionDate,
          fromAccountId: existingTransaction.fromAccountId,
          toAccountId: existingTransaction.toAccountId,
          description: existingTransaction.description,
          id: { not: existingTransaction.id }
        }
      });

      if (twinTransaction) {
        await prisma.transaction.delete({ where: { id: twinTransaction.id } });
        if (twinTransaction.accountId) affectedAccountIds.add(twinTransaction.accountId);
      }
    }

    // Tirtir kan hadda la doortay
    await prisma.transaction.delete({
      where: { id: id },
    });

    // Cusboonaysii balance-ka accounts-ka
    const { recalculateAccountBalance, updateExpenseStatus, updateProjectAdvancePaid, updateEmployeeSalaryStats } = await import('@/lib/accounting');

    for (const accId of affectedAccountIds) {
      await recalculateAccountBalance(accId);
    }

    // Update Expense Status if linked
    if (existingTransaction.expenseId) {
       await updateExpenseStatus(existingTransaction.expenseId);
    }

    // Update Project Status if linked
    if (existingTransaction.projectId) {
       await updateProjectAdvancePaid(existingTransaction.projectId);
    }

    // Update Employee Status if linked
    if (existingTransaction.employeeId) {
       await updateEmployeeSalaryStats(existingTransaction.employeeId);
    }

    // Notify about transaction deletion


    const transactionEvent = {
      id: id,
      projectId: existingTransaction.projectId,
      customerId: existingTransaction.customerId,
      action: 'deleted',
      timestamp: Date.now()
    };

    return NextResponse.json(
      { message: 'Dhaqdhaqaaqa lacagta (iyo mataankiisa haddii ay wareejin ahayd) si guul leh ayaa loo tirtiray!', event: transactionEvent },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka dhaqdhaqaaqa lacagta ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
