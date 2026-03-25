import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
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

    let output = '';
    if (projects.length === 0) {
      output = "No project found with 'Qolaji' in the name.";
    } else {
      output += `Found ${projects.length} project(s):\n`;
      projects.forEach(p => {
        output += `Project: ${p.name} (ID: ${p.id})\n`;
        output += `Customer: ${p.customer?.name || 'N/A'}\n`;
        output += `Agreement Amount: ${p.agreementAmount}\n`;
        output += `Advance Paid: ${p.advancePaid}\n`;
        
        const p300k = p.transactions.filter(t => Math.abs(Number(t.amount)) === 300000);
        if (p300k.length > 0) {
          output += `  Found ${p300k.length} transaction(s) of 300k:\n`;
          p300k.forEach(t => {
            output += `    - ID: ${t.id}, Amount: ${t.amount}, Type: ${t.type}, Description: ${t.description}, Date: ${t.transactionDate}\n`;
          });
        } else {
          output += `  No 300k transactions found for this project.\n`;
          output += `  All transactions associated with this project:\n`;
          p.transactions.forEach(t => {
             output += `    - Amount: ${t.amount}, Description: ${t.description}, Date: ${t.transactionDate}\n`;
          });
        }
      });
    }

    fs.writeFileSync('qolaji_results.txt', output);
    console.log("Results written to qolaji_results.txt");

  } catch (err) {
    fs.writeFileSync('qolaji_error.txt', String(err));
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
