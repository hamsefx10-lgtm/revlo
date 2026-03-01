const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const transactions = await prisma.transaction.findMany({
        where: { companyId },
        include: { account: true }
    });

    const types = {};
    const summary = {};
    let globalInflow = 0;

    transactions.forEach(t => {
        const amount = Number(t.amount);

        // Check if it's an inflow (including DEBT_TAKEN if not vendor)
        const isInflow = [
            'INCOME',
            'TRANSFER_IN',
            'SHAREHOLDER_DEPOSIT',
            'DEBT_RECEIVED',
            'DEBT_TAKEN' // Often loan received
        ].includes(t.type) || (t.type === 'DEBT_REPAID' && !t.vendorId);

        if (isInflow) {
            globalInflow += amount;

            const accName = t.account?.name || 'Unknown';
            if (!summary[accName]) summary[accName] = 0;
            summary[accName] += amount;

            if (!types[t.type]) types[t.type] = 0;
            types[t.type] += amount;
        }
    });

    console.log('Global Inflow Sum:', globalInflow);
    console.log('Inflow per Type:', JSON.stringify(types, null, 2));

    let cbeTotal = 0;
    let ebirrTotal = 0;

    Object.entries(summary).forEach(([name, amount]) => {
        const n = name.toLowerCase();
        if (n.includes('cbe')) cbeTotal += amount;
        if (n.includes('ebirr') || n.includes('e-birr')) ebirrTotal += amount;
    });

    console.log('\n--- Account Grouping Results ---');
    console.log('CBE Group Total:', cbeTotal);
    console.log('E-Birr Group Total:', ebirrTotal);
    console.log('Combined Total:', cbeTotal + ebirrTotal);

    console.log('\nUser Reported:');
    console.log('CBE:', 6269798);
    console.log('E-Birr:', 8469628.41);
    console.log('Total:', 14739426);

    console.log('\nDifferences (User - DB):');
    console.log('CBE Diff:', 6269798 - cbeTotal);
    console.log('E-Birr Diff:', 8469628.41 - ebirrTotal);
}

main().catch(console.error).finally(() => prisma.$disconnect());
