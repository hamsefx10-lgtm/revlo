const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v1 = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  
  // Directly mimic the API logic for Barako compeny
  const expenses = await prisma.expense.findMany({
    where: { vendorId: v1 },
    include: { transactions: true, vendor: true }
  });

  console.log(`Found ${expenses.length} expenses for Barako compeny.`);
  expenses.forEach(e => {
    const paid = e.transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const bal = Number(e.amount) - paid;
    console.log(`EXP: ${e.id} | Amt: ${e.amount} | Paid: ${paid} | Bal: ${bal} | Proj: ${e.projectId} | Status: ${e.paymentStatus}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
