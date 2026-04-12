import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const CBE_ID = 'c8306c05-5279-4b05-b5fc-dda41c793a77';
const CO_ID = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

async function main() {
  console.log('--- Auditing CBE for 127,000 ETB Discrepancy ---');

  // 1. Check current account field
  const cbeAcc = await p.account.findUnique({ where: { id: CBE_ID } });
  console.log('CBE Account Field:', cbeAcc.balance);

  // 2. Sum history for CBE
  const allTxs = await p.transaction.findMany({
    where: {
      companyId: CO_ID,
      OR: [{ accountId: CBE_ID }, { fromAccountId: CBE_ID }, { toAccountId: CBE_ID }]
    }
  });

  let balance = 0;
  for (const t of allTxs) {
    const amount = Math.abs(Number(t.amount));
    if (!t.accountId) {
       if (t.fromAccountId === CBE_ID) balance -= amount;
       if (t.toAccountId === CBE_ID) balance += amount;
    } else if (t.accountId === CBE_ID) {
       // Using original logic
       const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(t.type) || 
                          (t.type === 'DEBT_REPAID' && (!t.vendorId || !t.expenseId));
       const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'SALARY'].includes(t.type) || 
                           (t.type === 'DEBT_REPAID' && !!t.vendorId && !!t.expenseId);
       
       if (isStandardIn) balance += amount;
       else if (isStandardOut) balance -= amount;
    }
  }
  console.log('CBE History Sum:', balance);

  // 3. Look for 63.5k or 127k transactions
  const suspects = await p.transaction.findMany({
    where: {
      companyId: CO_ID,
      OR: [
        { amount: { gte: 63000, lte: 64000 } },
        { amount: { gte: 126000, lte: 128000 } }
      ]
    }
  });
  console.log('Suspect transactions:', JSON.stringify(suspects, null, 2));
}

