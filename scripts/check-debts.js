const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function checkDebts() {
    const allTxns = await prisma.transaction.findMany({
        include: {
            vendor: true,
            customer: true,
            project: true
        }
    });

    const allDebts = allTxns.filter(t => typeof t.type === 'string' && t.type.includes('DEBT'));

    let totalTaken = 0;
    let lines = [];
    lines.push('--- DEBT TRANSACTIONS ---');
    for (const t of allDebts) {
        const amount = Number(t.amount);
        if (t.type === 'DEBT_TAKEN') totalTaken += Math.abs(amount);
        lines.push(`[${t.transactionDate.toISOString().split('T')[0]}] [${t.type}] ${t.description} | Amount: ${amount} | Vendor: ${t.vendor?.name || 'N/A'} | Customer: ${t.customer?.name || 'N/A'} | Project: ${t.project?.name || 'N/A'}`);
    }
    lines.push(`\nTotal DEBT_TAKEN sum: ${totalTaken}`);

    fs.writeFileSync('debts-audit.txt', lines.join('\n'));
    console.log("Done counting, check debts-audit.txt");

    await prisma.$disconnect();
}

checkDebts().catch(e => console.error(e));
