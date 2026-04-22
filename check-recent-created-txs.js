const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ],
      createdAt: {
        gte: new Date('2026-04-18T00:00:00.000Z')
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log('--- Transactions created since April 18 ---');
  txs.forEach(t => {
    console.log(`[${t.createdAt.toISOString()}] Tx Date: ${t.transactionDate.toISOString().split('T')[0]}, Type: ${t.type}, Amount: ${t.amount}, Desc: ${t.description}`);
  });
}
main().finally(() => prisma.$disconnect());
