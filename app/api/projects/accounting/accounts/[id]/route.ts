// app/api/projects/accounting/accounts/[id]/route.ts - Single Accounting Account Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type

// GET /api/projects/accounting/accounts/[id] - Soo deji account gaar ah
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;

    const rawTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: id },
          { fromAccountId: id },
          { toAccountId: id }
        ],
        companyId: companyId
      },
      orderBy: [
        { transactionDate: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        project: { select: { name: true } },
        customer: { select: { name: true } },
        user: { select: { fullName: true } },
        employee: { select: { fullName: true } },
        fromAccount: { select: { name: true } },
        toAccount: { select: { name: true } }
      }
    });

    // Reconstruct the running balance with pure double-entry verification
    let currentBalance = 0;
    const allProcessed = rawTransactions.map((trx) => {
      const amount = Math.abs(Number(trx.amount));
      let isIncome = false;
      let change = 0;
      let shouldProcess = false;

      // 1. Unified Transfer Logic (For new single-record transfers)
      if (!trx.accountId) {
        if (trx.toAccountId === id) {
          isIncome = true;
          change = amount;
          shouldProcess = true;
        } else if (trx.fromAccountId === id) {
          isIncome = false;
          change = -amount;
          shouldProcess = true;
        }
      } else {
        // 2. Standard Logic (For non-transfers and OLD dual-record transfers)
        // We only process if accountId matches 'id' to avoid double-counting old pairs
        if (trx.accountId === id) {
          shouldProcess = true;
          const isStandardIn = [
            'INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN'
          ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

          const isStandardOut = [
            'EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT'
          ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && trx.vendorId);

          if (isStandardIn) {
            isIncome = true;
            change = amount;
          } else if (isStandardOut) {
            isIncome = false;
            change = -amount;
          }
        }
      }

      if (shouldProcess) {
        currentBalance += change;
      }

      return {
        ...trx,
        amount: amount, // Keep as absolute for UI consistency
        isIncome,
        runningBalance: currentBalance,
        shouldProcess
      };
    });

    // Filter to keep only relevant records for this ledger
    const history = allProcessed.filter(trx => trx.shouldProcess);

    const account = await prisma.account.findFirst({
      where: { id, companyId }
    });

    if (!account) {
      return NextResponse.json({ message: 'Account-ka lama helin.' }, { status: 404 });
    }

    // CRITICAL UPDATE: The user requested to decouple the transaction history recalculator from the account balance.
    // We are now keeping the balance exactly as it is in the database, relying purely on future transactions to change it.
    // Therefore, recalculateAccountBalance(id) has been disabled.

    // Pass the fully constructed history sorted ascending (oldest first to make running balance visually logical)
    const processedAccount = {
      ...account,
      transactions: history, // Removed .reverse() to fix visual running balance
      fromTransactions: [], // deprecated, all in history now
      toTransactions: [],   // deprecated, all in history now
    };

    return NextResponse.json({ account: processedAccount }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka account-ka ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/accounting/accounts/[id] - Cusboonaysii account gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;
    const { name, type, currency, balance } = await request.json();

    if (!name || !type || typeof currency !== 'string' || typeof balance !== 'number') {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca, Currency, Balance.' },
        { status: 400 }
      );
    }

    // Only update if account belongs to this company
    const existingAccount = await prisma.account.findFirst({ where: { id, companyId } });
    if (!existingAccount) {
      return NextResponse.json({ message: 'Account-ka lama helin.' }, { status: 404 });
    }

    const updatedAccount = await prisma.account.update({
      where: { id },
      data: {
        name,
        type,
        currency,
        balance,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Account-ka si guul leh ayaa loo cusboonaysiiyay!', account: updatedAccount },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka account-ka ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/accounting/accounts/[id] - Tirtir account gaar ah
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { getServerSession } = await import('next-auth/next');
    const { authOptions } = await import('@/lib/auth');
    const session = await getServerSession(authOptions);
    if (!session || !(session as any).user?.companyId) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const companyId = (session as any).user.companyId;

    // Hubi in account-ku jiro oo uu shirkaddan leeyahay
    const existingAccount = await prisma.account.findFirst({ where: { id, companyId } });
    if (!existingAccount) {
      return NextResponse.json({ message: 'Account-ka lama helin.' }, { status: 404 });
    }

    await prisma.account.delete({ where: { id } });

    return NextResponse.json(
      { message: 'Account-ka si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka account-ka ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
