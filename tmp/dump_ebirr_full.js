const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
    console.log(`Fetching FULL transactions for account: ${accountId}`);
    
    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { accountId: accountId },
                    { fromAccountId: accountId },
                    { toAccountId: accountId }
                ]
            },
            orderBy: [
                { transactionDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });
        
        fs.writeFileSync('tmp/ebirr_full_dump.json', JSON.stringify(transactions, null, 2));
        console.log(`Saved ${transactions.length} transactions to tmp/ebirr_full_dump.json`);
        
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
