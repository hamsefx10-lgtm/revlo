import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const CBE_ID = 'c8306c05-5279-4b05-b5fc-dda41c793a77';
const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
const CO_ID = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

async function main() {
  console.log('--- FINAL TRANSFER-BASED SELECTIVE CALIBRATION (Birshiil) ---');

  // 1. Purge ALL recent calibration and adjustment entries
  const del = await p.transaction.deleteMany({
    where: {
      companyId: CO_ID,
      OR: [
        { description: { contains: 'Calibration' } },
        { description: { contains: 'Adjustment' } }
      ]
    }
  });
  console.log('Purged trial calibration entries:', del.count);

  async function getSum(accId, targetDate) {
    const txs = await p.transaction.findMany({
      where: {
        companyId: CO_ID,
        transactionDate: { lte: targetDate },
        OR: [{ accountId: accId }, { fromAccountId: accId }, { toAccountId: accId }]
      }
    });

    let sum = 0;
    for (const t of txs) {
      const amount = Math.abs(Number(t.amount));
      if (!t.accountId) {
         if (t.fromAccountId === accId) sum -= amount;
         if (t.toAccountId === accId) sum += amount;
      } else if (t.accountId === accId) {
         const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(t.type) || 
                            (t.type === 'DEBT_REPAID' && (!t.vendorId || !t.expenseId));
         const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'SALARY'].includes(t.type) || 
                             (t.type === 'DEBT_REPAID' && !!t.vendorId && !!t.expenseId);
         
         if (isStandardIn) sum += amount;
         else if (isStandardOut) sum -= amount;
      }
    }
    return sum;
  }

  // Targets (Selective)
  const targets = [
    { date: '2026-03-01T00:00:00Z', label: 'Mar 17 (Night)', target: 54092.24, nightlyEnd: '2026-03-17T23:59:59Z' },
    { date: '2026-03-21T21:00:00Z', label: 'Mar 21 (Night)', target: 385940.94, nightlyEnd: '2026-03-21T23:59:59Z' },
    { date: '2026-03-22T21:00:00Z', label: 'Mar 22 (Night)', target: 351612.24, nightlyEnd: '2026-03-22T23:59:59Z' },
    { date: '2026-03-23T21:00:00Z', label: 'Mar 23 (Night)', target: 298482.24, nightlyEnd: '2026-03-23T23:59:59Z' },
    { date: '2026-03-24T21:00:00Z', label: 'Mar 24 (Night)', target: 233065.00, nightlyEnd: '2026-03-24T23:59:59Z' },
    { date: '2026-03-25T21:00:00Z', label: 'Mar 25 (Night)', target: 213015.24, nightlyEnd: '2026-03-25T23:59:59Z' },
    { date: '2026-03-26T21:00:00Z', label: 'Mar 26 (Night)', target: 124051.24, nightlyEnd: '2026-03-26T23:59:59Z' }
  ];

  // Also fix E-Birr 17th Anchor (TRANSFER MODE)
  const ebSum17 = await getSum(EBIRR_ID, new Date('2026-03-17T23:59:59Z'));
  const ebAdj17 = 7205 - ebSum17;
  await p.transaction.create({
    data: {
      companyId: CO_ID, accountId: EBIRR_ID,
      description: 'System Re-Calibration: Mar 17 (Night) (E-Birr Transfer Anchor)',
      amount: Math.abs(ebAdj17), type: ebAdj17 >= 0 ? 'TRANSFER_IN' : 'TRANSFER_OUT',
      transactionDate: new Date('2026-03-01T00:00:00Z')
    }
  });

  // CBE Selective Correction (TRANSFER MODE)
  for (const t of targets) {
    const currentSum = await getSum(CBE_ID, new Date(t.nightlyEnd));
    const adjNeeded = t.target - currentSum;
    
    console.log(`Fixing ${t.label}: CurrentSum=${currentSum}, Target=${t.target}, Need=${adjNeeded}`);
    
    await p.transaction.create({
      data: {
        companyId: CO_ID,
        accountId: CBE_ID,
        description: `System Re-Calibration: ${t.label} (CBE Transfer Anchor)`,
        amount: Math.round(Math.abs(adjNeeded) * 100) / 100,
        type: adjNeeded >= 0 ? 'TRANSFER_IN' : 'TRANSFER_OUT',
        transactionDate: new Date(t.date)
      }
    });
  }

  console.log('SUCCESS: Selective history anchored using TRANSFER mode. No Revenue Impact.');
}

main().catch(console.error).finally(() => p.$disconnect());
