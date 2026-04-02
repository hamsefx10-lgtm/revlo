const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const EBIRR = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const txs = await p.transaction.findMany({
    where: { 
      OR: [ {accountId: EBIRR}, {fromAccountId: EBIRR}, {toAccountId: EBIRR} ]
    }
  });

  let inSum = 0;
  let outSum = 0;
  
  txs.forEach(t => {
    const amt = Math.abs(Number(t.amount));
    if (!t.accountId) {
      if (t.toAccountId === EBIRR) inSum += amt;
      else if (t.fromAccountId === EBIRR) outSum += amt;
    } else if (t.accountId === EBIRR) {
      const type = t.type;
      const isIn = ['INCOME','DEBT_RECEIVED','TRANSFER_IN','SHAREHOLDER_DEPOSIT'].includes(type) || 
                   (type === 'DEBT_REPAID' && !t.vendorId && !t.expenseId);
      if (isIn) inSum += amt;
      else outSum += amt;
    }
  });

  console.log('LIVE DB SUM for Birshiil -> IN:', inSum, 'OUT:', outSum, 'NET:', inSum - outSum);
}

check()
  .catch(console.error)
  .finally(() => p.$disconnect());
