const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a'; // E-Birr
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    console.log('Account Balance:', account.balance);

    // Get transactions for this account sorted by date
    const txs = await prisma.transaction.findMany({
        where: { accountId },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    console.log('Last 5 transactions:', JSON.stringify(txs, null, 2));
}

main().finally(() => prisma.$disconnect());
