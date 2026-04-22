const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  // Get all transactions for this account
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    },
    orderBy: { transactionDate: 'desc' }
  });

  console.log('--- Total Transactions ---', txs.length);
  
  const recentTxs = txs.slice(0, 20).map(t => ({
    id: t.id,
    desc: t.description,
    type: t.type,
    amount: parseFloat(t.amount.toString()),
    date: t.transactionDate,
    accountId: t.accountId,
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId
  }));
  
  console.log(JSON.stringify(recentTxs, null, 2));
  
}
main().finally(() => prisma.$disconnect());
