const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      companyId: '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'
    }
  });

  let sum = 0;
  for (let t of txs) {
    if (Math.abs(parseFloat(t.amount.toString())) === 100018) {
      console.log('Found exact match 100018:', t);
    }
  }
}
main().finally(() => prisma.$disconnect());
