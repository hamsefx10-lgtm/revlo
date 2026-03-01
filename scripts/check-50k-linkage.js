
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const laborId = '27dda9df-e486-449e-b004-39d78827d733';
    const trx = await prisma.transaction.findMany({
        where: { expenseId: laborId }
    });

    console.log(`Transactions linked to Labor ID ${laborId}: ${trx.length}`);
    trx.forEach(t => {
        console.log(`- Trx ID: ${t.id}, Amount: ${t.amount}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
