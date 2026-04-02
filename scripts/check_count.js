const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function x() {
  const count = await prisma.transaction.count({
    where: { accountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a' }
  });
  console.log('TOTAL E-BIRR TXS ENABLED:', count);
}
x().finally(()=>prisma.$disconnect());
