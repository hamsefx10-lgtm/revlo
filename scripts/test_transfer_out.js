const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function x() {
  const txs = await p.transaction.findMany({ 
    where: { description: { contains: 'Wareejin: To Wallet' } } 
  });
  console.log(txs.map(t => ({ 
    d: t.transactionDate, desc: t.description, type: t.type, amt: t.amount, 
    acc: t.accountId, from: t.fromAccountId, to: t.toAccountId 
  })));
}
x().finally(()=>p.$disconnect());
