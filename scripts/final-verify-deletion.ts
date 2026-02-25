import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const targetId = '782bb502-fa34-4162-b878-7e5c0b4ceb9e';
    console.log(`Checking for transaction ID: ${targetId}`);

    const t = await prisma.transaction.findUnique({
        where: { id: targetId }
    });

    if (t) {
        console.log('RESULT: FOUND');
        console.log(JSON.stringify(t, null, 2));
    } else {
        console.log('RESULT: NOT FOUND (IT WAS DELETED)');

        // Search for any transaction for 30,000 to see if it was recreated or exists under different ID
        const others = await prisma.transaction.findMany({
            where: { amount: 30000 },
            include: { project: true }
        });
        console.log(`Other 30k transactions found: ${others.length}`);
        others.forEach(o => {
            console.log(`- ${o.id} | ${o.description} | Project: ${o.project?.name}`);
        });
    }

    // Check "Saylada Yucub" 60k too since it was in the duplicates file
    const yucubId = '959de5f7-7f6c-4f1b-83dc-33df9c9969b4';
    const y = await prisma.transaction.findUnique({ where: { id: yucubId } });
    console.log(`\nChecking "Saylada Yucub" ID ${yucubId}: ${y ? 'FOUND' : 'NOT FOUND (DELETED)'}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
