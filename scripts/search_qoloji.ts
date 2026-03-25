import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        name: {
          contains: 'qoloji',
          mode: 'insensitive'
        }
      },
      include: {
        transactions: true
      }
    });

    if (projects.length === 0) {
      console.log("No project found with 'qoloji' in the name.");
      return;
    }

    console.log(`Found ${projects.length} project(s):`);
    projects.forEach(p => {
      console.log(`Project: ${p.name} (ID: ${p.id})`);
      const advTxns = p.transactions.filter(t => Math.abs(Number(t.amount)) === 300000);
      if (advTxns.length > 0) {
        console.log(`  Found ${advTxns.length} transaction(s) of 300k:`);
        advTxns.forEach(t => {
          console.log(`    - ID: ${t.id}, Amount: ${t.amount}, Type: ${t.type}, Description: ${t.description}, Date: ${t.transactionDate}`);
        });
      } else {
        console.log(`  No 300k transactions found for this project.`);
        console.log(`  All transactions:`);
        p.transactions.forEach(t => {
           console.log(`    - Amount: ${t.amount}, Description: ${t.description}`);
        });
      }
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
