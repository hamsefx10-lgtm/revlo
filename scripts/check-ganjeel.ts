import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkGanjeel() {
    const projects = await prisma.project.findMany({
        where: { name: { contains: 'ganjeel' } },
        include: { transactions: true }
    });

    console.log(JSON.stringify(projects, null, 2));
    await prisma.$disconnect();
}

checkGanjeel().catch(console.error);
