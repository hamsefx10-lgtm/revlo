const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkIds() {
  const expMatch = await prisma.expense.findFirst({
    where: { amount: { gte: 1100000 }, vendor: { name: { contains: 'Barako', mode: 'insensitive' } } }
  });
  console.log('EXPENSE_ID:', expMatch ? expMatch.id : 'NOT FOUND');
  console.log('EXPENSE_DETAILS:', JSON.stringify(expMatch, null, 2));

  const trx300 = await prisma.transaction.findFirst({
    where: { OR: [{ amount: 300000 }, { amount: -300000 }], description: { contains: 'Barako', mode: 'insensitive' } }
  });
  console.log('TRX_300K:', trx300 ? trx300.id : 'NOT FOUND');

  const trx800 = await prisma.transaction.findFirst({
    where: { OR: [{ amount: 800000 }, { amount: -800000 }, { amount: 800000.00 }, { amount: -800000.00 }] }
  });
  console.log('TRX_800K:', trx800 ? trx800.id : 'NOT FOUND');
  if (trx800) console.log('TRX_800K_DETAILS:', JSON.stringify(trx800, null, 2));
}

checkIds()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
