import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const txs = await prisma.transaction.findMany({ where: { amount: 60000 } });
  console.log(txs.map(t => ({id: t.id, desc: t.description, type: t.type, amount: Number(t.amount)})));
}

run().finally(() => prisma.$disconnect());
