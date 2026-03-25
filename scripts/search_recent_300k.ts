import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { transactionDate: 'desc' },
      take: 20,
      include: {
        project: true,
        customer: true,
        account: true
      }
    });

    console.log("20 Recent Transactions:");
    transactions.forEach(t => {
      console.log(`- Amount: ${t.amount}, Date: ${t.transactionDate.toISOString().split('T')[0]}, Desc: ${t.description}, Project: ${t.project?.name || 'N/A'}`);
    });

    const threeHundredK = await prisma.transaction.findMany({
        where: {
            OR: [
                { amount: 300000 },
                { amount: -300000 }
            ]
        },
        include: {
            project: true,
            customer: true,
            account: true
        }
    });

    console.log("\nTransactions with 300,000 amount:");
    threeHundredK.forEach(t => {
      console.log(`- ID: ${t.id}, Date: ${t.transactionDate.toISOString().split('T')[0]}, Desc: ${t.description}, Project: ${t.project?.name || 'N/A'}, Customer: ${t.customer?.name || 'N/A'}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
