const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const transfers = await prisma.transaction.findMany({
        where: { companyId, type: 'TRANSFER_IN' },
        include: { account: true, fromAccount: true }
    });

    console.log('--- TRANSFER_IN Breakdown ---');
    transfers.forEach(t => {
        console.log(`Date: ${t.transactionDate.toISOString().split('T')[0]}, Amount: ${t.amount}, To: ${t.account?.name}, From: ${t.fromAccount?.name || 'Unknown'}`);
    });

    const totals = {};
    transfers.forEach(t => {
        const name = t.account?.name || 'Unknown';
        if (!totals[name]) totals[name] = 0;
        totals[name] += Number(t.amount);
    });

    console.log('\nTransfer Totals Received per Account:');
    console.log(JSON.stringify(totals, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
