
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const untrackedExpenses = [];
    const expenses = await prisma.expense.findMany({ where: { companyId: cid } });
    const allTrx = await prisma.transaction.findMany({ where: { companyId: cid } });

    for (const exp of expenses) {
        const hasIdLink = allTrx.some(t => t.expenseId === exp.id);
        if (!hasIdLink) {
            untrackedExpenses.push(exp);
        }
    }

    console.log(`Loose Match Audit for Birshiil (${cid})\n`);
    console.log(`Searching for 63 untracked expenses in the transactions table...`);

    let looseMatches = 0;
    for (const exp of untrackedExpenses) {
        const amount = parseFloat(exp.amount);
        const dateStr = exp.expenseDate.toISOString().split('T')[0];

        // Search for a transaction with same amount and date
        // Note: Transaction amount might be negative for expenses
        const match = allTrx.find(t =>
            (Math.abs(parseFloat(t.amount)) === Math.abs(amount)) &&
            (t.transactionDate.toISOString().split('T')[0] === dateStr)
        );

        if (match) {
            looseMatches++;
            // console.log(`- FOUND loose match for Exp ${exp.id}: Trx ${match.id} (Type: ${match.type}, Desc: ${match.description})`);
        }
    }

    console.log(`\nResults:`);
    console.log(`- Total Untracked Expenses: ${untrackedExpenses.length}`);
    console.log(`- Loose Matches found by (Amount + Date): ${looseMatches}`);
    console.log(`- Completely Missing from Transactions: ${untrackedExpenses.length - looseMatches}`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
