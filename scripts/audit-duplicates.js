const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v1 = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  const v2 = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac'; // Al-Barako
  
  const expenses = await prisma.expense.findMany({
    where: { OR: [{ vendorId: v1 }, { vendorId: v2 }] },
    include: { transactions: true, vendor: true }
  });
  
  console.log('--- ALL RELATED EXPENSES ---');
  expenses.forEach(e => {
    console.log(`ID: ${e.id} | Amt: ${e.amount} | Vendor: ${e.vendor?.name} | Desc: ${e.description} | Note: ${e.note}`);
  });

  const transactions = await prisma.transaction.findMany({
    where: { OR: [{ vendorId: v1 }, { vendorId: v2 }] },
    include: { vendor: true, expense: true }
  });
  
  console.log('\n--- ALL RELATED TRANSACTIONS ---');
  transactions.forEach(t => {
    console.log(`ID: ${t.id} | Amt: ${t.amount} | Vendor: ${t.vendor?.name} | Desc: ${t.description} | ExpID: ${t.expenseId}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
