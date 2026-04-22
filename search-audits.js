const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const audits = await prisma.auditLog.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' }
  });

  console.log('--- ALL Recent Audits ---');
  audits.forEach(a => {
    if (a.details.includes('100000') || a.details.includes('100,000') || a.details.includes('100018')) {
      console.log(`[${a.createdAt}] Action: ${a.action}, Entity: ${a.entityType}, Details: ${a.details}`);
    }
  });
  console.log('Done searching audits.');
}
main().finally(() => prisma.$disconnect());
