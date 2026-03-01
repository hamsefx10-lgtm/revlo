const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // Fetch all accounting transactions for the company
    const transactions = await prisma.transaction.findMany({
        where: { companyId },
        include: { account: true }
    });

    console.log(`Total Transactions Found: ${transactions.length}`);

    let globalIncome = 0;
    const summary = {};

    transactions.forEach(t => {
        const amount = Number(t.amount);

        // "Every Shilling" Inflow Logic:
        // INCOME, TRANSFER_IN, SHAREHOLDER_DEPOSIT, DEBT_RECEIVED, 
        // or DEBT_REPAID where vendorId is null
        const isInflow = [
            'INCOME',
            'TRANSFER_IN',
            'SHAREHOLDER_DEPOSIT',
            'DEBT_RECEIVED'
        ].includes(t.type) || (t.type === 'DEBT_REPAID' && !t.vendorId);

        if (isInflow) {
            globalIncome += amount;

            const accName = t.account?.name || 'Unknown';
            if (!summary[accName]) summary[accName] = 0;
            summary[accName] += amount;
        }
    });

    console.log('\nGlobal Income Sum (Inflows):', globalIncome);
    console.log('\nIncome Per Account Name:');
    console.log(JSON.stringify(summary, null, 2));

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

    // Also check if any transactions are missing accountId
    const missingAccount = transactions.filter(t => !t.accountId).length;
    console.log('\nTransactions missing accountId:', missingAccount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
