const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditTypes() {
    const types = await prisma.transaction.groupBy({
        by: ['type'],
        _count: {
            id: true
        }
    });

    console.log('Transaction Types in DB:');
    types.forEach(t => {
        console.log(`- ${t.type}: ${t._count.id}`);
    });

    const eBirrId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
    const txCount = await prisma.transaction.count({
        where: {
            OR: [
                { accountId: eBirrId },
                { fromAccountId: eBirrId },
                { toAccountId: eBirrId }
            ]
        }
    });
    console.log(`\nE-Birr has ${txCount} transactions.`);

    // Check for double counting fields
    const doubleCountCheck = await prisma.transaction.findFirst({
        where: {
            accountId: { not: null },
            OR: [
                { toAccountId: { not: null } },
                { fromAccountId: { not: null } }
            ]
        }
    });
    if (doubleCountCheck) {
        console.log('\nFound transaction with both accountId and to/fromAccountId:');
        console.log(JSON.stringify(doubleCountCheck, null, 2));
    } else {
        console.log('\nNo transactions found with both accountId and to/fromAccountId.');
    }
}

auditTypes().catch(console.error).finally(() => prisma.$disconnect());
