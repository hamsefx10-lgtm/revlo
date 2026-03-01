
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const expenses = await prisma.expense.findMany({
        where: { companyId: cid }
    });

    const allTrx = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    const trulyMissing = [];
    const differentType = [];

    for (const exp of expenses) {
        const matchingTrx = allTrx.find(t => t.expenseId === exp.id);
        if (!matchingTrx) {
            trulyMissing.push(exp);
        } else if (matchingTrx.type !== 'EXPENSE') {
            differentType.push({ exp, trx: matchingTrx });
        }
    }

    console.log(`Final Integrity Audit for Birshiil (${cid})\n`);
    console.log(`Total Expense Records: ${expenses.length}`);
    console.log(`Expenses WITHOUT any linked Transaction: ${trulyMissing.length}`);
    console.log(`Expenses linked to non-EXPENSE Transactions: ${differentType.length}`);

    if (differentType.length > 0) {
        console.log(`\nSample of Expenses with different types:`);
        differentType.slice(0, 10).forEach(item => {
            console.log(`- Exp ID: ${item.exp.id}, Cat: ${item.exp.category}, Sub: ${item.exp.subCategory} => Trx Type: ${item.trx.type}`);
        });
    }

    if (trulyMissing.length > 0) {
        console.log(`\nSample of Truly Missing Transactions:`);
        trulyMissing.slice(0, 10).forEach(e => {
            console.log(`- ID: ${e.id}, Date: ${e.expenseDate.toISOString().split('T')[0]}, Cat: ${e.category}, Amount: ${e.amount}, Desc: ${e.description}`);
        });
    }

}

main().catch(console.error).finally(() => prisma.$disconnect());
