const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDashboardDiscrepancies() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    console.log("Starting Dashboard Discrepancy Fixes...");

    // 1. Delete Duplicate Incomes
    const duplicateIds = [
        '959de5f7-7f6c-4f1b-83dc-33df9c9969b4', // 60,000 ETB
        '782bb502-fa34-4162-b878-7e5c0b4ceb9e'  // 30,000 ETB
    ];

    console.log(`\n--- Stage 1: Deleting duplicate manual incomes ---`);
    for (const dId of duplicateIds) {
        try {
            const deleted = await prisma.transaction.delete({
                where: { id: dId }
            });
            console.log(`Deleted duplicate transaction ${dId} for amount: ${deleted.amount}`);
        } catch (e) {
            console.log(`Transaction ${dId} might already be deleted or not found. Error: ${e.message}`);
        }
    }

    // 2. Fix Ghost Expense (5,000 ETB)
    console.log(`\n--- Stage 2: Linking ghost expense to CBE account ---`);
    const ghostExpenseId = 'b34a5cf3-b73a-46bd-820d-04101b27f058';
    const cbeAcc = await prisma.account.findFirst({
        where: { name: { contains: 'CBE', mode: 'insensitive' }, companyId }
    });

    const expense = await prisma.expense.findFirst({
        where: { id: ghostExpenseId },
        include: { transactions: true }
    });

    if (expense) {
        if (expense.transactions.length === 0) {
            const newTxn = await prisma.transaction.create({
                data: {
                    description: `Expense: ${expense.description}`,
                    amount: expense.amount,
                    type: 'EXPENSE',
                    transactionDate: expense.date,
                    accountId: cbeAcc.id,
                    expenseId: expense.id,
                    companyId: companyId,
                    userId: expense.userId, // use whoever created the expense
                    note: 'Auto-synced transaction for stranded expense'
                }
            });
            console.log(`Created new transaction ${newTxn.id} for ghost expense ${ghostExpenseId} mapped to CBE.`);
        } else {
            console.log(`Ghost expense ${ghostExpenseId} already has a transaction.`);
        }
    } else {
        console.log(`Ghost expense ${ghostExpenseId} not found.`);
    }

    console.log("\nSuccess: Pre-processing patches absolute. Next, run rebuild-balances-v4.js to finalize physical balances.");
}

fixDashboardDiscrepancies().finally(() => prisma.$disconnect());
