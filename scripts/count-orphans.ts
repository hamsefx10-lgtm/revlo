import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function countOrphans() {
    const projects = await prisma.project.findMany();
    let count = 0;
    for (const project of projects) {
        const orphanedTxs = await prisma.transaction.findMany({
            where: {
                projectId: null,
                type: 'INCOME',
                description: { contains: project.name }
            }
        });
        const linkedTxs = await prisma.transaction.findMany({ where: { projectId: project.id, type: 'INCOME' } });
        const sumOrphaned = orphanedTxs.reduce((sum, t) => sum + Number(t.amount||0), 0);
        const sumLinked = linkedTxs.reduce((sum, t) => sum + Number(t.amount||0), 0);
        const advanceInDB = Number(project.advancePaid || 0);

        if (sumOrphaned > 0 || (sumLinked !== advanceInDB)) {
             count++;
        }
    }
    console.log(`TOTAL AFFECTED: ${count}`);
    await prisma.$disconnect();
}
countOrphans().catch(console.error);
