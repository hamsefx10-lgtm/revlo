const { PrismaClient } = require('@prisma/client');
const { recalculateAccountBalance } = require('./lib/accounting.ts');
const p = new PrismaClient();
async function x() {
  await recalculateAccountBalance('3c156507-ea0a-4974-8a54-92f1e9dd519a');
  console.log('Balance synced.');
}
x().catch(console.error).finally(()=>p.$disconnect());
