const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function auditTxns() {
    const transactions = await prisma.transaction.findMany();

    const sampleTransfers = transactions.filter(t => t.type === 'TRANSFER_IN' || t.type === 'TRANSFER_OUT' || t.type === 'TRANSFER');
    const sampleIncome = transactions.filter(t => t.type === 'INCOME').slice(0, 5);
    const sampleExpense = transactions.filter(t => t.type === 'EXPENSE').slice(0, 5);
    const sampleRepaid = transactions.filter(t => t.type === 'DEBT_REPAID').slice(0, 5);
    const allTypes = [...new Set(transactions.map(t => t.type))];

    fs.writeFileSync('audit-txns.json', JSON.stringify({
        allTypes,
        sampleTransfers: sampleTransfers.slice(0, 10),
        sampleIncome,
        sampleExpense,
        sampleRepaid,
        totalTransactions: transactions.length
    }, null, 2));

    console.log("Dumped sample transactions to audit-txns.json");
}

auditTxns().finally(() => prisma.$disconnect());
