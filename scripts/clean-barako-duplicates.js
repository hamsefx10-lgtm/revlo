const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanDuplicates() {
  const alBarakoId = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac';
  
  // 1. Find all expenses for Al-Barako
  const expenses = await prisma.expense.findMany({
    where: { vendorId: alBarakoId },
    include: { transactions: true }
  });

  console.log(`Analyzing ${expenses.length} Al-Barako expenses...`);

  // Group by (amount, description, date) to find duplicates
  const expGroups = {};
  for (const e of expenses) {
    const key = `${e.amount}_${e.description}_${e.expenseDate?.toISOString()}`;
    if (!expGroups[key]) expGroups[key] = [];
    expGroups[key].push(e);
  }

  for (const [key, group] of Object.entries(expGroups)) {
    if (group.length > 1) {
      console.log(`Found ${group.length} duplicate expenses for key: ${key}`);
      // Keep the one with most transactions, or just the first one
      const [toKeep, ...toDelete] = group.sort((a, b) => b.transactions.length - a.transactions.length);
      
      for (const d of toDelete) {
        console.log(`  Deleting duplicate Expense: ${d.id}`);
        // First move any transactions to the kept expense
        for (const t of d.transactions) {
          console.log(`    Moving TRX ${t.id} to kept Expense ${toKeep.id}`);
          await prisma.transaction.update({
            where: { id: t.id },
            data: { expenseId: toKeep.id }
          });
        }
        await prisma.expense.delete({ where: { id: d.id } });
      }
    }
  }

  // 2. Find all transactions for Al-Barako
  const transactions = await prisma.transaction.findMany({
    where: { vendorId: alBarakoId }
  });

  console.log(`Analyzing ${transactions.length} Al-Barako transactions...`);

  // Group by (amount, description, date, expenseId) to find duplicate payments
  const trxGroups = {};
  for (const t of transactions) {
    const key = `${t.amount}_${t.description}_${t.transactionDate?.toISOString()}_${t.expenseId}`;
    if (!trxGroups[key]) trxGroups[key] = [];
    trxGroups[key].push(t);
  }

  for (const [key, group] of Object.entries(trxGroups)) {
    if (group.length > 1) {
      console.log(`Found ${group.length} duplicate transactions for key: ${key}`);
      const [toKeep, ...toDelete] = group;
      for (const d of toDelete) {
        console.log(`  Deleting duplicate Transaction: ${d.id}`);
        await prisma.transaction.delete({ where: { id: d.id } });
      }
    }
  }

  console.log('Cleanup complete!');
}

cleanDuplicates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
