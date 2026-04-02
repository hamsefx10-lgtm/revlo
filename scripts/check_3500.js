const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function x() {
  const allTxs = await prisma.transaction.findMany({ where: { accountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a', amount: 3500 } });
  console.log('3500 TXS IN DB:', allTxs.length);
  
  const allTxs700 = await prisma.transaction.findMany({ where: { accountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a', amount: 700 } });
  console.log('700 TXS IN DB:', allTxs700.length);
}
x().finally(()=>prisma.$disconnect());
