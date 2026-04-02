const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const acc = await p.account.findUnique({
    where: { id: '3c156507-ea0a-4974-8a54-92f1e9dd519a' }
  });
  console.log(acc);
}
check().finally(()=>p.$disconnect());
