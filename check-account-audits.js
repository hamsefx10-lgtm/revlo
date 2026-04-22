const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const audits = await prisma.auditLog.findMany({
    where: {
      entity: 'Account',
      details: { contains: '3c156507-ea0a-4974-8a54-92f1e9dd519a' }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('--- Account Audits ---');
  audits.forEach(a => {
    console.log(`[${a.createdAt}] Action: ${a.action}, Details: ${a.details}`);
  });
  console.log('Done.');
}
main().finally(() => prisma.$disconnect());
