const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // 1. Check Income Calculation (Overview logic)
    const incomeResult = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
            companyId,
            OR: [
                { type: 'INCOME' },
                { type: 'TRANSFER_IN' },
                { type: 'DEBT_REPAID', vendorId: null }
            ]
        },
    });
    console.log('Total Income (Simulation):', incomeResult._sum.amount);

    // 2. Check Expense Calculation (Overview logic)
    const expenseResult = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
            companyId,
            OR: [
                { type: 'EXPENSE' },
                { type: 'TRANSFER_OUT' },
                { type: 'DEBT_TAKEN' },
                { type: 'DEBT_REPAID', vendorId: { not: null } }
            ],
            category: { not: 'FIXED_ASSET_PURCHASE' }
        },
    });
    console.log('Total Expenses (Simulation):', expenseResult._sum.amount);

    // 3. Find specific 29k transaction and see if it is in expenses or income simulation
    const tx29k = await prisma.transaction.findFirst({
        where: { id: '4051e601-dff7-4a47-872f-b4509c2e662f' }
    });

    // Logic check:
    const isInIncome = (['INCOME', 'TRANSFER_IN'].includes(tx29k.type) || (tx29k.type === 'DEBT_REPAID' && !tx29k.vendorId));
    const isInExpense = (['EXPENSE', 'TRANSFER_OUT', 'DEBT_TAKEN'].includes(tx29k.type) || (tx29k.type === 'DEBT_REPAID' && tx29k.vendorId));

    console.log(`Transaction 29k (${tx29k.type}, vendorId: ${tx29k.vendorId}):`);
    console.log(`- Included in Income? ${isInIncome}`);
    console.log(`- Included in Expense? ${isInExpense}`);
}

main().finally(() => prisma.$disconnect());
