
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // Find all Expenses for this company
    const expenses = await prisma.expense.findMany({
        where: { companyId: cid }
    });

    console.log(`Auditing Expenses for Birshiil (${cid})`);
    console.log(`Total Expense records found: ${expenses.length}`);

    // Find all Transactions of type EXPENSE for this company
    const expenseTrx = await prisma.transaction.findMany({
        where: {
            companyId: cid,
            type: 'EXPENSE'
        }
    });

    console.log(`Total Transactions of type EXPENSE: ${expenseTrx.length}`);

    // Check if every Expense record has a linked transaction
    // The Expense model usually has a transactionId or is linked via the Transaction.expenseId field.
    // Judging by the schema we saw earlier: Transaction has expenseId String?

    const untrackedExpenses = [];
    for (const exp of expenses) {
        const hasTrx = expenseTrx.some(t => t.expenseId === exp.id);
        if (!hasTrx) {
            untrackedExpenses.push(exp);
        }
    }

    console.log(`\nExpense records WITHOUT a linked Transaction: ${untrackedExpenses.length}`);
    if (untrackedExpenses.length > 0) {
        untrackedExpenses.slice(0, 10).forEach(e => {
            console.log(`- Missing: ID: ${e.id}, Description: ${e.description}, Amount: ${e.amount}`);
        });
    }

}

main().catch(console.error).finally(() => prisma.$disconnect());
