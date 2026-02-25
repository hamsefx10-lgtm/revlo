const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMissingTxns() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // 1. Get all expenses
    const expenses = await prisma.expense.findMany({
        where: { companyId },
        include: { transactions: true }
    });

    let sumExpensesWithoutTxn = 0;
    let expensesWithoutTxn = [];

    for (const exp of expenses) {
        if (exp.transactions.length === 0) {
            sumExpensesWithoutTxn += Number(exp.amount);
            expensesWithoutTxn.push({
                id: exp.id,
                description: exp.description,
                amount: Number(exp.amount),
                type: exp.expenseType,
                date: exp.date
            });
        }
    }

    // 2. See what project advances might be missing
    // Actually, let's first check expenses since 58,000 sounds like it could be a sum of missing expenses
    console.log(`Found ${expensesWithoutTxn.length} expenses without transactions.`);
    console.log(`Total amount of these ghost expenses: ${sumExpensesWithoutTxn}`);

    if (expensesWithoutTxn.length > 0) {
        console.log(expensesWithoutTxn);
    }

    // Next, let's check projects advance paid without transactions
    const projects = await prisma.project.findMany({
        where: { companyId },
        include: { transactions: true }
    });

    let sumProjectsWithoutTxn = 0;
    for (const proj of projects) {
        const advancePaid = Number(proj.advancePaid || 0);
        if (advancePaid > 0) {
            // Check if there's an income transaction for this project
            const incomeTxns = proj.transactions.filter(t => t.type === 'INCOME' || t.type === 'DEBT_REPAID');
            let totalTxnIn = 0;
            incomeTxns.forEach(t => totalTxnIn += Number(t.amount));

            if (totalTxnIn < advancePaid) {
                sumProjectsWithoutTxn += (advancePaid - totalTxnIn);
                console.log(`Project ${proj.name} advanced ${advancePaid} but txn only has ${totalTxnIn}`);
            }
        }
    }
    console.log(`Total Project Advances missing transactions: ${sumProjectsWithoutTxn}`);

}

checkMissingTxns().finally(() => prisma.$disconnect());
