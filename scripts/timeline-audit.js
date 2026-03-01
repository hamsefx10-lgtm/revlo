
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projectIds = [
        '35a1ea4e-3e67-40b4-9edc-7411482ba453', // Ahmed
        'b531edb0-87ad-4054-952a-b2914cfbc8ee'  // Saylada
    ];

    for (const id of projectIds) {
        const p = await prisma.project.findUnique({ where: { id } });
        console.log(`\nProject: ${p.name} (Created: ${p.createdAt.toISOString()})`);
        console.log(`Advance Amount: ${p.advancePaid}`);

        const trxs = await prisma.transaction.findMany({ where: { projectId: id } });
        trxs.forEach(t => {
            console.log(`  - Trx: ${t.type}, Amt: ${t.amount}, Desc: ${t.description}, Date: ${t.createdAt.toISOString()}`);
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
