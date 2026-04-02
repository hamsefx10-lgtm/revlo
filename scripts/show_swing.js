const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showSwing() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: EBIRR_ID },
        { fromAccountId: EBIRR_ID },
        { toAccountId: EBIRR_ID }
      ]
    }
  });

  let validExcelRows = 0;
  let otherRows = 0;
  
  let otherSwing = 0;

  for(let trx of txs) {
      let a = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;
      
      // We inserted our verified data today (2026-03-31) and their accountId is EBIRR_ID
      if (trx.accountId === EBIRR_ID && trx.createdAt >= new Date('2026-03-31T00:00:00.000Z')) {
          validExcelRows++;
          continue; 
      }
      
      otherRows++;
      let chg = 0;
      if (!trx.accountId) {
          if (trx.toAccountId === EBIRR_ID) chg = a;
          else if (trx.fromAccountId === EBIRR_ID) chg = -a;
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
      otherSwing += chg;
  }

  console.log(`NEW EXCEL ROWS: ${validExcelRows}`); 
  console.log(`OTHER ROWS COUNT: ${otherRows}`); 
  console.log(`OTHER SWING IMPACT: ${otherSwing}`); 
}
showSwing().finally(() => prisma.$disconnect());
