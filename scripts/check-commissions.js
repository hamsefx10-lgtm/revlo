
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { description: { contains: 'Commission', mode: 'insensitive' } },
        { description: { contains: 'Fee', mode: 'insensitive' } },
        { description: { contains: 'Gees', mode: 'insensitive' } }, // Somali for fee/commission context if any
      ]
    },
    take: 20
  });
  console.log(JSON.stringify(txs, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
