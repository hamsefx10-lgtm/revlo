import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const projects = await prisma.project.findMany({
      where: {
        name: {
          contains: 'Qolaji',
          mode: 'insensitive'
        }
      },
      include: {
        transactions: true,
        customer: true
      }
    });

    if (projects.length === 0) {
      console.log("No project found with 'Qolaji' in the name.");
      return;
    }

    console.log(`Found ${projects.length} project(s):`);
    projects.forEach(p => {
      console.log(`Project: ${p.name} (ID: ${p.id})`);
      console.log(`Customer: ${p.customer?.name || 'N/A'}`);
      console.log(`Agreement Amount: ${p.agreementAmount}`);
      console.log(`Advance Paid: ${p.advancePaid}`);
      
      const p300k = p.transactions.filter(t => Math.abs(Number(t.amount)) === 300000);
      if (p300k.length > 0) {
        console.log(`  Found ${p300k.length} transaction(s) of 300k:`);
        p300k.forEach(t => {
          console.log(`    - ID: ${t.id}, Amount: ${t.amount}, Type: ${t.type}, Description: ${t.description}, Date: ${t.transactionDate}`);
        });
      } else {
        console.log(`  No 300k transactions found for this project.`);
        console.log(`  All transactions associated with this project:`);
        p.transactions.forEach(t => {
           console.log(`    - Amount: ${t.amount}, Description: ${t.description}, Date: ${t.transactionDate}`);
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
