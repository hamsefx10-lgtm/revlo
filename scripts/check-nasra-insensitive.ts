import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkNasra() {
    console.log("Checking Nasra Site (Case Insensitive)...");
    const projects = await prisma.project.findMany();
    
    const nasraProjects = projects.filter(p => p.name.toLowerCase().includes('nasra'));

    for (const p of nasraProjects) {
        console.log(`\nProject: ${p.name}`);
        console.log(`- Top Advance Paid in DB: ${p.advancePaid}`);
        
        const linkedTxs = await prisma.transaction.findMany({ where: { projectId: p.id } });

        console.log(`- Linked Transactions directly to project ID (${p.id}):`);
        linkedTxs.forEach(t => console.log(`  * [${t.type}] Amount: ${t.amount}, Desc: ${t.description}`));

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
