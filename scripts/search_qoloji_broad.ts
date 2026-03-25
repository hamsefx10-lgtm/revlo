import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { description: { contains: 'qoloji', mode: 'insensitive' } },
          { note: { contains: 'qoloji', mode: 'insensitive' } },
          { customer: { name: { contains: 'qoloji', mode: 'insensitive' } } },
          { project: { name: { contains: 'qoloji', mode: 'insensitive' } } }
        ]
      },
      include: {
        project: true,
        customer: true,
        account: true
      }
    });

    if (transactions.length === 0) {
      console.log("No transactions found matching 'qoloji'.");
      // Search for everything with 300k just to be sure
      const all300k = await prisma.transaction.findMany({
          where: {
              amount: 300000
          },
          include: {
              project: true,
              customer: true
          }
      });
      if (all300k.length > 0) {
          console.log("\nFound these 300k transactions (but none matched 'qoloji'):");
          all300k.forEach(t => {
              console.log(`- Project: ${t.project?.name || 'N/A'}, Customer: ${t.customer?.name || 'N/A'}, Desc: ${t.description}`);
          });
      }
      return;
    }

    console.log(`Found ${transactions.length} transaction(s) matching 'qoloji':`);
    transactions.forEach(t => {
      console.log(`- ID: ${t.id}`);
      console.log(`  Amount: ${t.amount}`);
      console.log(`  Date: ${t.transactionDate}`);
      console.log(`  Description: ${t.description}`);
      console.log(`  Project: ${t.project?.name || 'N/A'}`);
      console.log(`  Customer: ${t.customer?.name || 'N/A'}`);
      console.log(`  Account: ${t.account?.name || 'N/A'}`);
      console.log('-------------------');
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
