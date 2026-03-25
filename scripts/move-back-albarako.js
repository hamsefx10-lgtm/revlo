const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetId = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  const sourceId = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac'; // Al-Barako

  // Find occurrences of "Al-Barako" in the "Barako compeny" record
  const trxs = await prisma.transaction.findMany({
    where: {
      vendorId: targetId,
      OR: [
        { description: { contains: 'Al-Barako', mode: 'insensitive' } },
        { note: { contains: 'Al-Barako', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Found ${trxs.length} transactions to move back.`);
  for (const t of trxs) {
    await prisma.transaction.update({
      where: { id: t.id },
      data: { vendorId: sourceId }
    });
    console.log(`  Moved back TX: ${t.id} - ${t.description}`);
  }

  const exps = await prisma.expense.findMany({
    where: {
      vendorId: targetId,
      OR: [
        { description: { contains: 'Al-Barako', mode: 'insensitive' } },
        { note: { contains: 'Al-Barako', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Found ${exps.length} expenses to move back.`);
  for (const e of exps) {
    await prisma.expense.update({
      where: { id: e.id },
      data: { vendorId: sourceId }
    });
    console.log(`  Moved back EXP: ${e.id} - ${e.description}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
