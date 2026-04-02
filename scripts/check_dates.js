const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function x() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const txs = await p.transaction.findMany({ 
    where: { accountId }, 
    orderBy: { transactionDate: 'asc' } 
  });
  const odd = txs.filter(t => new Date(t.transactionDate).getFullYear() < 2024);
  console.log('ODD DATES:');
  odd.forEach(o => console.log(o.id, '|', new Date(o.transactionDate).toISOString(), '|', o.description, '|', o.amount));
}
x().finally(()=>p.$disconnect());
