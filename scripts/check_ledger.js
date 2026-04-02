const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function x() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const txs = await p.transaction.findMany({ 
    where: { OR: [{accountId}, {fromAccountId: accountId}, {toAccountId: accountId}] }, 
    orderBy: { transactionDate: 'asc' } 
  });
  
  console.log('FIRST 5 TXS IN E-BIRR (by Date):'); 
  txs.slice(0,5).forEach(t => console.log(new Date(t.transactionDate).toISOString(), '|', t.type, '|', t.amount, '|', t.description)); 
  
  console.log('\nLAST 5 TXS (by Date):'); 
  txs.slice(-5).forEach(t => console.log(new Date(t.transactionDate).toISOString(), '|', t.type, '|', t.amount, '|', t.description)); 
} 
x().finally(()=>p.$disconnect());
