const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAlBarako() {
  const alBarakoId = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac';
  
  // 1. Find all transactions that belong to Al-Barako and have an expenseId
  const trxs = await prisma.transaction.findMany({
    where: { 
      vendorId: alBarakoId, 
      NOT: { expenseId: null } 
    },
    select: { expenseId: true }
  });

  const expenseIds = [...new Set(trxs.map(t => t.expenseId))];
  console.log(`Found ${expenseIds.length} expenses linked to Al-Barako transactions.`);

  for (const id of expenseIds) {
    if (!id) continue;
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (exp && exp.vendorId !== alBarakoId) {
      console.log(`Migrating Expense ${id} (Current Vendor: ${exp.vendorId}) to Al-Barako...`);
      await prisma.expense.update({
        where: { id },
        data: { vendorId: alBarakoId }
      });
    }
  }

  console.log('Al-Barako expense fix complete!');
}

fixAlBarako()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
