
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projectIds = [
        '35a1ea4e-3e67-40b4-9edc-7411482ba453',
        'b531edb0-87ad-4054-952a-b2914cfbc8ee'
    ];

    for (const id of projectIds) {
        const p = await prisma.project.findUnique({ where: { id } });
        if (p) {
            console.log(`Project: ${p.name}`);
            console.log(`- Advance Paid (in Project Table): ${p.advancePaid}`);

            const trxs = await prisma.transaction.findMany({ where: { projectId: id, type: 'INCOME' } });
            console.log(`- INCOME Transactions: ${trxs.length}`);
            trxs.forEach(t => {
                console.log(`  - Amt: ${t.amount}, Desc: ${t.description}`);
            });
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
