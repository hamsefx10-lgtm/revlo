const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trxs = await prisma.transaction.findMany({
    where: { OR: [{ amount: 15950 }, { amount: -15950 }] },
    include: { vendor: true, expense: true }
  });
  console.log(JSON.stringify(trxs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
