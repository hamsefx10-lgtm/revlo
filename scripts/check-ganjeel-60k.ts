import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const t = await prisma.transaction.findUnique({ where: { id: 'bebbb82c-960c-4938-b392-c7a1eafff78f' } });
  console.log(t);
}

run().finally(() => prisma.$disconnect());
