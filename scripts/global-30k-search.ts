import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Global search for 30,000 ETB transactions...");

    const txs = await prisma.transaction.findMany({
        where: {
            OR: [
                { amount: 30000 },
                { amount: -30000 }
            ]
        },
        include: {
            project: true,
            customer: true,
            vendor: true,
            account: true
        }
    });

    console.log(`Found ${txs.length} transactions with amount 30,000:`);
    txs.forEach(t => {
        console.log(`- ID: ${t.id} | Date: ${t.transactionDate.toISOString().split('T')[0]} | Type: ${t.type} | Project: ${t.project?.name || 'MISSING'} | Customer: ${t.customer?.name || 'MISSING'} | Desc: ${t.description}`);
    });

    // Check DEBT_REPAID transactions in general
    const debtRepaid = await prisma.transaction.findMany({
        where: { type: 'DEBT_REPAID' },
        include: { project: true, customer: true, vendor: true },
        take: 20,
        orderBy: { transactionDate: 'desc' }
    });

    console.log(`\nRecent DEBT_REPAID transactions (last 20):`);
    debtRepaid.forEach(t => {
        console.log(`- ID: ${t.id} | Amt: ${t.amount} | Project: ${t.project?.name || 'N/A'} | Entity: ${t.customer?.name || t.vendor?.name || 'N/A'} | Desc: ${t.description}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
