const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const EBIRR = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const txs = await p.transaction.findMany({
    where: { OR: [ {accountId: EBIRR}, {fromAccountId: EBIRR}, {toAccountId: EBIRR} ] }
  });
  let balance = 0;
  txs.forEach(t => {
    const amt = Math.abs(Number(t.amount));
    if (!t.accountId) {
      if (t.toAccountId === EBIRR) balance += amt;
      else if (t.fromAccountId === EBIRR) balance -= amt;
    } else if (t.accountId === EBIRR) {
      const type = t.type;
      const isIn = ['INCOME','DEBT_RECEIVED','TRANSFER_IN','SHAREHOLDER_DEPOSIT'].includes(type) || (type === 'DEBT_REPAID' && !t.vendorId && !t.expenseId);
      if (isIn) balance += amt;
      else balance -= amt;
    }
  });
  console.log('BALANCE SCRIPT:', balance);
}
check().finally(()=>p.$disconnect());
