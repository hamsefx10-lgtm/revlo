// app/api/accounting/transactions/transfer/route.ts - Accounting Transfer API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { Decimal } from '@prisma/client/runtime/library'; // Import Decimal type
import { getSessionCompanyUser } from '@/lib/auth';

// POST /api/accounting/transactions/transfer - Wareeji lacag u dhexeysa accounts-ka
export async function POST(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId, userId } = sessionData;

    const requestBody = await request.json();
    const {
      fromAccountId, toAccountId, amount, description, transactionDate, note, feeAmount
    } = requestBody;

    // 1. Xaqiijinta Input-ka
    if (!fromAccountId || !toAccountId || typeof amount !== 'number' || amount <= 0 || !description || !transactionDate) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Laga Wareejiyay, Loo Wareejiyay, Qiime, Sharaxaad, Taariikhda.' },
        { status: 400 }
      );
    }
    if (fromAccountId === toAccountId) {
      return NextResponse.json(
        { message: 'Accounts-ka wareejinta ma noqon karaan isku mid.' },
        { status: 400 }
      );
    }

    // Hubi jiritaanka accounts-ka
    const sourceAccount = await prisma.account.findUnique({ where: { id: fromAccountId } });
    const destinationAccount = await prisma.account.findUnique({ where: { id: toAccountId } });

    if (!sourceAccount) {
      return NextResponse.json({ message: 'Account-ka laga wareejinayo lama helin.' }, { status: 400 });
    }
    if (!destinationAccount) {
      return NextResponse.json({ message: 'Account-ka loo wareejinayo lama helin.' }, { status: 400 });
    }

    // Hubi in account-ka laga wareejinayo uu leeyahay lacag ku filan (Amount + Fee)
    const totalDeduction = amount + (Number(feeAmount) || 0);

    if (sourceAccount.balance < totalDeduction) {
      return NextResponse.json(
        { message: `Account-ka '${sourceAccount.name}' ma laha lacag ku filan. Waxay u baahan tahay ${totalDeduction.toLocaleString()} ${sourceAccount.currency} (Wareejin + Khidmad), laakiin waxaa ku jirta ${sourceAccount.balance.toLocaleString()} ${sourceAccount.currency}.` },
        { status: 400 }
      );
    }

    // Bilaw dhaqdhaqaaqa database-ka (transaction)
    // Tani waxay hubinaysaa in labada update ay wada dhacaan ama midna uusan dhicin (atomicity)
    await prisma.$transaction(async (prisma: any) => {
      // 1. Cusboonaysii balance-ka accounts-ka
      // Deduct transfer amount + feeAmount (if any) from source account
      // Note: feeAmount is optional in the request, default to 0 if not present
      const fee = requestBody.feeAmount ? Number(requestBody.feeAmount) : 0;

      await prisma.account.update({
        where: { id: sourceAccount.id },
        data: { balance: new Decimal(sourceAccount.balance - amount - fee) },
      });

      await prisma.account.update({
        where: { id: destinationAccount.id },
        data: { balance: new Decimal(destinationAccount.balance + amount) },
      });

      // 2. Abuur diiwaanada transactions-ka (labo transaction oo isku xiran)
      // Transaction-ka laga wareejiyay (EXPENSE type from source account)
      await prisma.transaction.create({
        data: {
          description: `Wareejin: ${description} (Loo Wareejiyay: ${destinationAccount.name})`,
          amount: new Decimal(-amount), // Negative amount for transfer out
          type: 'TRANSFER_OUT',
          transactionDate: new Date(transactionDate),
          note: note || null,
          accountId: sourceAccount.id, // Primary account for this transaction
          fromAccountId: sourceAccount.id,
          toAccountId: destinationAccount.id,
          userId,
          companyId,
        },
      });

      // Transaction-ka loo wareejiyay (INCOME type to destination account)
      await prisma.transaction.create({
        data: {
          description: `Wareejin: ${description} (Laga Wareejiyay: ${sourceAccount.name})`,
          amount: new Decimal(amount), // Positive amount for transfer in
          type: 'TRANSFER_IN',
          transactionDate: new Date(transactionDate),
          note: note || null,
          accountId: destinationAccount.id, // Primary account for this transaction
          fromAccountId: sourceAccount.id,
          toAccountId: destinationAccount.id,
          userId,
          companyId,
        },
      });

      // 3. Record Fee Transaction if exists
      if (fee > 0) {
        await prisma.transaction.create({
          data: {
            description: `Khidmad Wareejin: ${description}`,
            amount: new Decimal(-fee), // Negative as it's an expense
            type: 'EXPENSE',
            category: 'Bank Charges', // Or 'Service Fee'
            transactionDate: new Date(transactionDate),
            note: note ? `Khidmad ku socota wareejinta: ${note}` : null,
            accountId: sourceAccount.id,
            userId,
            companyId,
          },
        });
      }
    });

    return NextResponse.json(
      { message: `Si guul leh ayaa lacagta looga wareejiyay ${sourceAccount.name} loona wareejiyay ${destinationAccount.name}!`, amount },
      { status: 200 } // OK
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka lacagta la wareejinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
