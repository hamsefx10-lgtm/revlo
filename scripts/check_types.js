const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function x() {
  const result = await p.transaction.groupBy({
    by: ['type'],
    _count: { _all: true },
  });
  console.log(result);
}
x().finally(() => p.$disconnect());
