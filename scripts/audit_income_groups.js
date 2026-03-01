const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // 1. Global Income (Every Shilling Logic)
    const globalIncomeGroup = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
            companyId,
            OR: [
                { type: 'INCOME' },
                { type: 'TRANSFER_IN' },
                { type: 'SHAREHOLDER_DEPOSIT' },
                { type: 'DEBT_RECEIVED' },
                { type: 'DEBT_REPAID', vendorId: null }
            ]
        }
    });

    console.log('Global Income Sum (Inflows):', globalIncomeGroup._sum.amount);

    // 2. Per Account Grouping
    const transactions = await prisma.transaction.findMany({
        where: {
            companyId,
            OR: [
                { type: 'INCOME' },
                { type: 'TRANSFER_IN' },
                { type: 'SHAREHOLDER_DEPOSIT' },
                { type: 'DEBT_RECEIVED' },
                { type: 'DEBT_REPAID', vendorId: null }
            ]
        },
        include: { account: true }
    });

    const summary = {};
    transactions.forEach(t => {
        const accName = t.account?.name || 'Unknown';
        if (!summary[accName]) summary[accName] = 0;
        summary[accName] += Number(t.amount);
    });

    console.log('\nIncome Per Account Name:');
    console.log(JSON.stringify(summary, null, 2));

    // 3. Totals for CBE and E-Birr groups
    let cbeTotal = 0;
    let ebirrTotal = 0;

    Object.entries(summary).forEach(([name, amount]) => {
        const n = name.toLowerCase();
        if (n.includes('cbe')) cbeTotal += amount;
        if (n.includes('ebirr')) ebirrTotal += amount;
    });

    console.log('\n--- Final Comparison ---');
    console.log('CBE Group Total:', cbeTotal);
    console.log('E-Birr Group Total:', ebirrTotal);
    console.log('Combined Total:', cbeTotal + ebirrTotal);
}

main().catch(console.error).finally(() => prisma.$disconnect());
