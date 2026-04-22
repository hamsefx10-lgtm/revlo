const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.deletedItem.findMany({
    where: {
      modelName: 'Transaction'
    },
    orderBy: { deletedAt: 'desc' },
    take: 50
  });

  console.log('--- Recent Deleted Transactions ---');
  let found = false;
  deleted.forEach(d => {
    try {
      const data = JSON.parse(d.data);
      if (data.accountId === '3c156507-ea0a-4974-8a54-92f1e9dd519a' || 
          data.fromAccountId === '3c156507-ea0a-4974-8a54-92f1e9dd519a' || 
          data.toAccountId === '3c156507-ea0a-4974-8a54-92f1e9dd519a') {
        found = true;
        console.log(`Deleted at: ${d.deletedAt}, By User ID: ${d.deletedBy}`);
        console.log(`Data: Type=${data.type}, Amount=${data.amount}, Date=${data.transactionDate}, Desc=${data.description}`);
        console.log(`---`);
      }
    } catch(e) {}
  });
  if (!found) console.log('None found in last 50 deleted items.');
}
main().finally(() => prisma.$disconnect());
