const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = '7a106acd-7659-4d8f-8289-3f3e683e89a0';
  const v = await prisma.shopVendor.findUnique({
    where: { id },
    include: { expenses: true, transactions: true }
  });
  
  const totalExp = v.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalPaid = v.transactions.reduce((s, t) => {
    if (['EXPENSE', 'DEBT_REPAID'].includes(t.type)) return s + Math.abs(Number(t.amount));
    return s;
  }, 0);
  
  console.log('VENDOR: ' + v.name);
  console.log('TOTAL_EXP: ' + totalExp);
  console.log('TOTAL_PAID: ' + totalPaid);
  console.log('REMAINING: ' + (totalExp - totalPaid));
}

main().catch(console.error).finally(() => prisma.$disconnect());
