const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditTransfers() {
    const amounts = [44145, 16353.21];

    for (const amount of amounts) {
        console.log(`\n--- Inspecting transactions with amount: ${amount} ---`);
        const transactions = await prisma.transaction.findMany({
            where: {
                amount: {
                    gte: amount - 0.01,
                    lte: amount + 0.01
                }
            }
        });

        transactions.forEach(t => {
            console.log(JSON.stringify(t, null, 2));
        });
    }
}

auditTransfers().catch(console.error).finally(() => prisma.$disconnect());
