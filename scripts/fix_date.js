const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function fix() {
  await p.transaction.update({
    where: { id: '060da874-094c-4589-9685-96847b9b7bba' },
    data: { transactionDate: new Date('2026-03-27T21:32:44.000Z') }
  });
  console.log('Fixed Year 0785 to 2026.');
}
fix().finally(()=>p.$disconnect());
