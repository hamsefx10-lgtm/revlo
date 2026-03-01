
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const labor = await prisma.projectLabor.findMany({
        where: {
            OR: [
                { agreedWage: 49999 },
                { paidAmount: 49999 },
                { agreedWage: 50000 },
                { description: { contains: 'almuniamka' } }
            ]
        }
    });

    console.log(`Found ${labor.length} matching labor records:`);
    labor.forEach(l => {
        console.log(`- ID: ${l.id}, Amount: ${l.agreedWage}, Paid: ${l.paidAmount}, Desc: ${l.description}, Date: ${l.dateWorked.toISOString()}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
