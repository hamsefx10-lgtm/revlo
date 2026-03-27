
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    take: 50,
    orderBy: { transactionDate: 'desc' }
  });
  console.log(JSON.stringify(txs, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
