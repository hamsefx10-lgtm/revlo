const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
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
  let c = 0;

  for(let trx of txs) {
    let a = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;
    let chg = 0;
    let sp = false;

    if (!trx.accountId) {
      if (trx.toAccountId === EBIRR_ID) { chg = a; sp=true; }
      else if (trx.fromAccountId === EBIRR_ID) { chg = -a; sp=true; }
    } else {
      if (trx.accountId === EBIRR_ID) {
        sp=true;
        const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(trx.type) || 
            (trx.type === 'DEBT_REPAID' && (!trx.vendorId && !trx.expenseId && !(trx.description && trx.description.includes('Flipped to Outflow'))));

        const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'SALARY', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || 
            (trx.type === 'DEBT_REPAID' && (!!trx.vendorId || !!trx.expenseId || (trx.description && trx.description.includes('Flipped to Outflow'))));

        if (isStandardIn) chg = a;
        else if (isStandardOut) chg = -a;
      }
    }

    if (sp) currentBalance += chg;
    c++;
    
    if (trx.transactionDate.toISOString().startsWith('2026-03-07')) {
         console.log(`[3/7] DATE: ${trx.transactionDate.toISOString()} | DESC: ${trx.description.substring(0, 30)} | CHG: ${chg} | UI_BAL: ${currentBalance}`);
    }
    
    if (trx.transactionDate.toISOString().startsWith('2026-03-16')) {
         console.log(`[3/16] DATE: ${trx.transactionDate.toISOString()} | DESC: ${trx.description.substring(0, 30)} | CHG: ${chg} | UI_BAL: ${currentBalance}`);
    }
  }

  console.log('FINAL UI BAL:', currentBalance);
}
check().finally(()=>prisma.$disconnect());
