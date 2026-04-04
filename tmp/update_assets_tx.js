const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const txs = [
    { id: '5dc9f42b-5777-4fc2-b5fe-acfe93d11f12', targetDate: new Date('2025-12-11T00:00:00.000Z') }, // Shuter
    { id: 'aedd188f-819d-4a6b-afdf-f3f344a7fcbf', targetDate: new Date('2025-11-12T00:00:00.000Z') }  // JigSaw
  ];

  for (const t of txs) {
    const updated = await prisma.transaction.update({
      where: { id: t.id },
      data: { transactionDate: t.targetDate }
    });
    console.log(`Updated transaction ${updated.id} to transactionDate ${updated.transactionDate.toISOString()}`);
  }
}

run()
  .then(() => {
    console.log('Successfully aligned transaction dates with their respective Fixed Asset purchaseDates!');
    prisma.$disconnect();
  })
  .catch(console.error);
