const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixExpenses() {
  const targetVendorId = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  
  // Find all transactions in the target vendor that have an expense linked
  const trxs = await prisma.transaction.findMany({
    where: { vendorId: targetVendorId, NOT: { expenseId: null } },
    select: { expenseId: true }
  });

  const expenseIds = [...new Set(trxs.map(t => t.expenseId))];
  console.log(`Found ${expenseIds.length} unique expense IDs linked to Barako transactions.`);

  for (const id of expenseIds) {
    if (!id) continue;
    const exp = await prisma.expense.findUnique({ where: { id } });
    if (exp && exp.vendorId !== targetVendorId) {
      console.log(`Migrating Expense ${id} (Current Vendor: ${exp.vendorId}) to target...`);
      await prisma.expense.update({
        where: { id },
        data: { vendorId: targetVendorId }
      });
    }
  }

  console.log('Expense migration complete!');
}

fixExpenses()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
