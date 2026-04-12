import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function scanGanjeel() {
    const projects = await prisma.project.findMany({
        where: { name: { contains: 'ganjeel' } },
        include: { transactions: true }
    });

    for (const p of projects) {
        console.log(`Project: ${p.name}`);
        console.log(`Advance Paid in DB: ${p.advancePaid}`);
        console.log("Transactions:");
        for (const t of p.transactions) {
            console.log(`- Type: ${t.type}, Amount: ${t.amount}, AccountID: ${t.accountId}, Desc: ${t.description}`);
        }
    }
    await prisma.$disconnect();
}

scanGanjeel().catch(console.error);
