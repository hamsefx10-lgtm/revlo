const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v1 = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  const v2 = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac'; // Al-Barako
  
  const e1 = await prisma.expense.findMany({ where: { vendorId: v1 }, select: { id: true, amount: true, description: true } });
  const e2 = await prisma.expense.findMany({ where: { vendorId: v2 }, select: { id: true, amount: true, description: true } });
  
  console.log('BARAKO_COMPENY_EXPS (Count: ' + e1.length + '):');
  e1.forEach(e => console.log(`  - ${e.id} | ${e.amount} | ${e.description}`));
  
  console.log('\nALBARAKO_EXPS (Count: ' + e2.length + '):');
  e2.forEach(e => console.log(`  - ${e.id} | ${e.amount} | ${e.description}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
