const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function trace190() {
    const companyId = 'd22beba9-b3c3-40a5-8375-6ad7d7794265'; // birshiil work shop

    const projects = await prisma.project.findMany({ where: { companyId } });
    let sumAdvances = 0;
    for (const p of projects) {
        sumAdvances += Number(p.advancePaid);
    }

    const txns = await prisma.transaction.findMany({ where: { companyId } });
    let totalIncome = 0;
    for (const t of txns) {
        if (t.type === 'INCOME') {
            totalIncome += Math.abs(Number(t.amount));
        }
    }

    // Cross check if any income or transfer for this company went to an account for another company.
    const accounts = await prisma.account.findMany();
    const accountMap = {};
    accounts.forEach(a => accountMap[a.id] = a.companyId);

    let mismatches = [];
    for (const t of txns) {
        if (t.accountId && accountMap[t.accountId] !== companyId) {
            mismatches.push(`Txn ${t.id} (${t.amount} ${t.type}) -> Account ${t.accountId} belongs to ${accountMap[t.accountId]}`);
        }
    }

    const result = {
        sumAdvances,
        totalIncome,
        mismatches
    };

    fs.writeFileSync('temp-190.json', JSON.stringify(result, null, 2));
}
trace190().finally(() => prisma.$disconnect());
