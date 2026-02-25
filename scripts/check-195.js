const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function check() {
    const accounts = await prisma.account.findMany();
    let totalBalance = 0;
    accounts.forEach(a => totalBalance += Number(a.balance));

    const transactions = await prisma.transaction.findMany();
    let found195kTxns = [];

    for (const t of transactions) {
        if (Math.abs(Number(t.amount)) === 195000) {
            found195kTxns.push(t);
        }
    }

    // Find all "Advance Payment" txns
    let sumAdvanceTxns = 0;
    transactions.forEach(t => {
        if ((t.description || '').toLowerCase().includes('advance payment for project')) {
            sumAdvanceTxns += Math.abs(Number(t.amount));
        }
    });

    const projects = await prisma.project.findMany();
    let sumProjectAdvances = 0;
    projects.forEach(p => {
        sumProjectAdvances += Number(p.advancePaid);
    });

    fs.writeFileSync('check-195.json', JSON.stringify({
        totalBalance,
        sumAdvanceTxns,
        sumProjectAdvances,
        difference: sumProjectAdvances - sumAdvanceTxns,
        found195kTxns
    }, null, 2));

    console.log("Wrote check-195.json");
}

check().finally(() => prisma.$disconnect());
