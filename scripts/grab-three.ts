import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function findThree() {
    const projects = await prisma.project.findMany();
    let broken = [];
    for (const project of projects) {
        const orphanedTxs = await prisma.transaction.findMany({
            where: {
                projectId: null,
                type: 'INCOME',
                description: { contains: project.name }
            }
        });
        const advanceInDB = Number(project.advancePaid || 0);

        if (orphanedTxs.length > 0 && advanceInDB === 0) {
             broken.push({
                 projectName: project.name,
                 orphanedTxs: orphanedTxs.map(t => ({ amount: t.amount, desc: t.description }))
             });
        }
    }
    console.log(JSON.stringify(broken.slice(0, 5), null, 2));
    await prisma.$disconnect();
}
findThree().catch(console.error);
