import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function findNames() {
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
        if (orphanedTxs.length > 0) {
             broken.push({
                 name: project.name,
                 amt: orphanedTxs[0].amount
             });
        }
    }
    console.log(JSON.stringify(broken.filter(p => !p.name.includes('ganjeel')).slice(0, 3), null, 2));
    await prisma.$disconnect();
}
findNames();
