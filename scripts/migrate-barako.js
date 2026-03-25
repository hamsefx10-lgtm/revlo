const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  const sourceId = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac'; // Al-Barako
  const targetId = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  
  console.log(`Starting migration from ${sourceId} to ${targetId}...`);

  // 1. Find and update TRANSACTIONS
  const trxs = await prisma.transaction.findMany({
    where: {
      AND: [
        {
          OR: [
            { vendorId: sourceId },
            { vendorId: null }
          ]
        },
        {
          OR: [
            { description: { contains: 'Barako', mode: 'insensitive' } },
            { description: { contains: 'Barakat', mode: 'insensitive' } },
            { note: { contains: 'Barako', mode: 'insensitive' } },
            { note: { contains: 'Barakat', mode: 'insensitive' } }
          ]
        }
      ]
    }
  });

  console.log(`Found ${trxs.length} transactions to migrate.`);
  for (const t of trxs) {
    await prisma.transaction.update({
      where: { id: t.id },
      data: { vendorId: targetId }
    });
    console.log(`  Migrated TX: ${t.id} - ${t.description || t.note}`);
  }

  // 2. Find and update EXPENSES
  const exps = await prisma.expense.findMany({
    where: {
      AND: [
        {
          OR: [
            { vendorId: sourceId },
            { vendorId: null }
          ]
        },
        {
          OR: [
            { description: { contains: 'Barako', mode: 'insensitive' } },
            { description: { contains: 'Barakat', mode: 'insensitive' } },
            { note: { contains: 'Barako', mode: 'insensitive' } },
            { note: { contains: 'Barakat', mode: 'insensitive' } }
          ]
        }
      ]
    }
  });

  console.log(`Found ${exps.length} expenses to migrate.`);
  for (const e of exps) {
    await prisma.expense.update({
      where: { id: e.id },
      data: { vendorId: targetId }
    });
    console.log(`  Migrated EXP: ${e.id} - ${e.description || e.note}`);
  }

  console.log('Migration complete!');
}

migrateData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
