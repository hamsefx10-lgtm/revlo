const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: EBIRR_ID },
        { fromAccountId: EBIRR_ID },
        { toAccountId: EBIRR_ID }
      ]
    },
    orderBy: [
      { transactionDate: 'asc' },
      { createdAt: 'asc' }
    ]
  });

  let currentBalance = 0;
  for(let trx of txs) {
    let a = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;
    let chg = 0;
    
    if (!trx.accountId) {
      if (trx.toAccountId === EBIRR_ID) { chg = a; }
      else if (trx.fromAccountId === EBIRR_ID) { chg = -a; }
    } else {
      if (trx.accountId === EBIRR_ID) {
        const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(trx.type) || 
            (trx.type === 'DEBT_REPAID' && (!trx.vendorId && !trx.expenseId && !(trx.description && trx.description.includes('Flipped to Outflow'))));

        const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'SALARY', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || 
            (trx.type === 'DEBT_REPAID' && (!!trx.vendorId || !!trx.expenseId || (trx.description && trx.description.includes('Flipped to Outflow'))));

        if (isStandardIn) chg = a;
        else if (isStandardOut) chg = -a;
      }
    }

    currentBalance += chg;
  }

  // We want to find OLD transactions that came from other Accounts!
  const oldTransfers = txs.filter(t => t.toAccountId === EBIRR_ID || t.fromAccountId === EBIRR_ID);
  
  console.log(`TOTAL OLD TRANSFERS INVOLVING EBIRR (BUT NOT EBIRR_ID): ${oldTransfers.length}`);
  for(let ot of oldTransfers) {
      console.log(`OLD TRANSFER DATE: ${ot.transactionDate.toISOString()} | AMOUNT: ${ot.amount} | FROM: ${ot.fromAccountId} | TO: ${ot.toAccountId}`);
  }

  console.log('FINAL UI BAL:', currentBalance);
}
inspect().finally(()=>prisma.$disconnect());
