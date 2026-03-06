const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const txs = await prisma.transaction.findMany({
        orderBy: { transactionDate: 'desc' },
        take: 10,
        select: {
            transactionDate: true,
            type: true,
            amount: true,
            description: true
        }
    });
    console.log('\nMost recent transactions in DB:');
    for (const t of txs) {
        console.log(`- ${t.transactionDate.toISOString()} | ${t.type} | ${t.amount} | ${t.description}`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
