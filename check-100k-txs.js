const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: {
      companyId: '081fb675-b41e-4cea-92f7-50a5eb3e6f1e',
      amount: { gte: 90000, lte: 110000 }
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

  console.log('--- Transactions around 100k ---');
  txs.forEach(t => {
    console.log(`[${t.transactionDate.toISOString()}] ${t.type} ${t.amount} (Acc: ${t.account?.name || t.accountId}) - ${t.description}`);
  });
}
main().finally(() => prisma.$disconnect());
