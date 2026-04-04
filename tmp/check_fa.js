const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const gte = new Date('2026-03-19T00:00:00Z');
  const lt = new Date('2026-03-20T00:00:00Z');
  
  const fa = await prisma.fixedAsset.findMany({ where: { purchaseDate: { gte, lt } } });
  console.log('Fixed Assets on that date:', fa.map(f => `${f.name} = ${f.value}`));
}
run().then(() => prisma.$disconnect());
