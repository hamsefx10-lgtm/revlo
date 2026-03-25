const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const trxs = await prisma.transaction.findMany({
      where: {
        OR: [
          { accountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a' },
          { fromAccountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a' },
          { toAccountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a' }
        ]
      },
      orderBy: [
        { transactionDate: 'asc' },
        { createdAt: 'asc' }
      ],
      include: {
        vendor: true,
        customer: true,
        project: true
      }
    });
    console.log(JSON.stringify(trxs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
