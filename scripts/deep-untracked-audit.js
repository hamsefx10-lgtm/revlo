
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const expenses = await prisma.expense.findMany({
        where: { companyId: cid }
    });

    const expenseTrx = await prisma.transaction.findMany({
        where: {
            companyId: cid,
            type: 'EXPENSE'
        }
    });

    const untrackedExpenses = [];
    for (const exp of expenses) {
        const hasTrx = expenseTrx.some(t => t.expenseId === exp.id);
        if (!hasTrx) {
            untrackedExpenses.push(exp);
        }
    }

    console.log(`Deep Audit of Untracked Expenses for Birshiil:\n`);

    const categoryStats = {};
    untrackedExpenses.forEach(e => {
        const key = `${e.category} / ${e.subCategory || 'NoSub'}`;
        if (!categoryStats[key]) categoryStats[key] = 0;
        categoryStats[key]++;
    });

    console.log(`Summary by Category:`);
    console.table(categoryStats);

    console.log(`\nSample of Untracked Expenses:`);
    untrackedExpenses.slice(0, 20).forEach(e => {
        console.log(`- ID: ${e.id}, Date: ${e.expenseDate.toISOString().split('T')[0]}, Cat: ${e.category}, Sub: ${e.subCategory}, Amount: ${e.amount}, Desc: ${e.description}`);
    });

}

main().catch(console.error).finally(() => prisma.$disconnect());
