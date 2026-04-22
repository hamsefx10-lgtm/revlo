const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const audits = await prisma.auditLog.findMany({
    where: {
      details: { contains: accountId }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  console.log('--- Recent Audits ---');
  audits.forEach(a => {
    console.log(`[${a.createdAt}] Action: ${a.action}, Entity: ${a.entityType}, Details: ${a.details}`);
  });
  
  if (audits.length === 0) {
    console.log('No audits found for this account ID.');
  }
}
main().finally(() => prisma.$disconnect());
