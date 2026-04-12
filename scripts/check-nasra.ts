import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkNasra() {
    console.log("Checking Nasra Site...");
    const projects = await prisma.project.findMany({
        where: { name: { contains: 'nasra' } },
        include: { transactions: true }
    });

    for (const p of projects) {
        console.log(`\nProject: ${p.name}`);
        console.log(`- Top Advance Paid in DB: ${p.advancePaid}`);
        console.log(`- Linked Transactions directly to project ID (${p.id}):`);
        p.transactions.forEach(t => console.log(`  * [${t.type}] Amount: ${t.amount}, Desc: ${t.description}`));

        // Let's also find orphaned transactions
        const orphaned = await prisma.transaction.findMany({
            where: {
                projectId: null,
                description: { contains: p.name }
            }
        });
        console.log(`- Orphaned Transactions matching name '${p.name}':`);
        orphaned.forEach(t => console.log(`  * [${t.type}] Amount: ${t.amount}, Desc: ${t.description}`));
    }
    
    await prisma.$disconnect();
}
checkNasra().catch(console.error);
