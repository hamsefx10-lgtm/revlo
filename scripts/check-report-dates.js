const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const dateStr = '2026-03-03';
    const start = new Date(dateStr);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    console.log('Querying from:', start.toISOString(), 'to', end.toISOString());

    const txs = await prisma.transaction.findMany({
        where: {
            transactionDate: { gte: start, lt: end }
        }
    });
    console.log('Found', txs.length, 'transactions for March 3rd');

    const allRecentTxs = await prisma.transaction.findMany({
        orderBy: { transactionDate: 'desc' },
        take: 5
    });
    console.log('\nMost recent transactions in DB:');
    allRecentTxs.forEach(t => console.log(`- ${t.transactionDate.toISOString()}: ${t.type} ${t.amount}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
