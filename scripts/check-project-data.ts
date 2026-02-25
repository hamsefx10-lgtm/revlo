
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkProjectData() {
    const projectId = 'cm79m0p8f0003zskw3p308nd1'; // Example project ID from logs if possible, or just fetch one

    const projects = await prisma.project.findMany({
        take: 5,
        include: {
            expenses: true,
            transactions: true,
        }
    });

    for (const p of projects) {
        const recordsSum = p.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const txnsSum = p.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const combined = recordsSum + txnsSum;

        console.log(`Project: ${p.name}`);
        console.log(`  Expenses Records Sum: ${recordsSum}`);
        console.log(`  Transactions Sum: ${txnsSum}`);
        console.log(`  Combined: ${combined}`);
        console.log(`  Transaction Types:`, p.transactions.map(t => `${t.type}: ${t.amount}`));
    }

    await prisma.$disconnect();
}

checkProjectData();
