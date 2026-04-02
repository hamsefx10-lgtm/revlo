const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inject() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const companyId = 'b73a216a-0490-4e39-bfa2-3d5fcdbe792b';
  
  // Actually, let's fetch companyId to be safe
  const acc = await prisma.account.findUnique({ where: { id: accountId }});
  
  await prisma.transaction.create({
      data: {
          accountId,
          companyId: acc.companyId,
          description: 'adan xamalka (La Xiriira: ahmed abdule site)',
          type: 'EXPENSE',
          amount: 3500,
          transactionDate: new Date('2026-01-26T12:00:00.000Z'),
      }
  });

  await prisma.transaction.create({
      data: {
          accountId,
          companyId: acc.companyId,
          description: 'kaarka saacada laxaamada (La Xiriira: ahmed abdule site)',
          type: 'EXPENSE',
          amount: 700,
          transactionDate: new Date('2026-03-15T12:00:00.000Z'),
      }
  });
  
  await prisma.transaction.updateMany({
       where: { accountId }, data: { updatedAt: new Date() }
  });

  console.log('Injected the 2 missing valid rows!');
}

inject().finally(() => prisma.$disconnect());
