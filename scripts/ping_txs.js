const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function fix() {
  await p.transaction.updateMany({
    where: { accountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a' },
    data: { updatedAt: new Date() }
  });
  console.log('Pinged Account.');
}
fix().finally(()=>p.$disconnect());
