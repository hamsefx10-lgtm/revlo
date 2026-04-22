const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accounts = await prisma.account.findMany({
    where: { companyId: '081fb675-b41e-4cea-92f7-50a5eb3e6f1e' }
  });

  const txs = await prisma.transaction.findMany({
    where: {
      companyId: '081fb675-b41e-4cea-92f7-50a5eb3e6f1e',
      transactionDate: {
        gte: new Date('2026-04-18T00:00:00.000Z'),
        lt: new Date('2026-04-21T00:00:00.000Z')
      }
    },
    select: {
      amount: true,
      type: true,
      description: true,
      transactionDate: true,
      accountId: true,
      account: { select: { name: true } }
    }
  });

  console.log('--- Transactions around 19th ---');
  txs.forEach(t => {
    if (Math.abs(parseFloat(t.amount.toString())) >= 10000) {
      console.log(`[${t.transactionDate.toISOString()}] ${t.type} ${t.amount} (Acc: ${t.account?.name || t.accountId}) - ${t.description}`);
    }
  });
}
main().finally(() => prisma.$disconnect());
