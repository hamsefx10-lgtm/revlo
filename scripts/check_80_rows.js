const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check80() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: EBIRR_ID },
        { fromAccountId: EBIRR_ID },
        { toAccountId: EBIRR_ID }
      ],
      createdAt: { lt: new Date('2026-03-31T00:00:00.000Z') } // Exclude our fresh 768 rows
    }
  });

  const pre17 = txs.filter(t => t.transactionDate <= new Date('2026-03-16T23:59:59.999Z'));
  const post16 = txs.filter(t => t.transactionDate > new Date('2026-03-16T23:59:59.999Z'));
  
  let preSwing = 0;
  for (let trx of pre17) {
      let a = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;
      if (!trx.accountId) {
          if (trx.toAccountId === EBIRR_ID) preSwing += a;
          else if (trx.fromAccountId === EBIRR_ID) preSwing -= a;
      } else {
          if (trx.accountId === EBIRR_ID) {
              const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(trx.type) || 
                  (trx.type === 'DEBT_REPAID' && (!trx.vendorId && !trx.expenseId && !(trx.description && trx.description.includes('Flipped to Outflow'))));
      
              const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'SALARY', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || 
                  (trx.type === 'DEBT_REPAID' && (!!trx.vendorId || !!trx.expenseId || (trx.description && trx.description.includes('Flipped to Outflow'))));
      
              if (isStandardIn) preSwing += a;
              else if (isStandardOut) preSwing -= a;
          }
      }
  }

  console.log(`PRE-17 ROWS COUNT: ${pre17.length} | SWING: ${preSwing}`);
  console.log(`POST-16 ROWS COUNT: ${post16.length}`);
}
check80().finally(()=>prisma.$disconnect());
