import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const customerTxs = await prisma.transaction.findMany({
    where: { customerId: '8646a04a-0eac-464c-9c7d-24406a7b05be' }
  });
  console.log(customerTxs.map(t => ({id: t.id, amount: Number(t.amount), type: t.type, desc: t.description, project: t.projectId})));
}

run().finally(() => prisma.$disconnect());
