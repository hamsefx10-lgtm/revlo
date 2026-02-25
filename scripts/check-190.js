const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function trace190() {
    const companyId = 'd22beba9-b3c3-40a5-8375-6ad7d7794265'; // birshiil work shop

    const projects = await prisma.project.findMany({ where: { companyId } });
    let sumAdvances = 0;
    for (const p of projects) {
        console.log(`Project: ${p.name} | Advance: ${p.advancePaid}`);
        sumAdvances += Number(p.advancePaid);
    }
    console.log("Total Advances for this company:", sumAdvances);

    const txns = await prisma.transaction.findMany({ where: { companyId } });
    let totalIncome = 0;
    for (const t of txns) {
        if (t.type === 'INCOME') {
            console.log(`Income Txn: ${t.amount} | Account ID: ${t.accountId}`);
            totalIncome += Math.abs(Number(t.amount));
        }
    }
    console.log("Total Income Txns for this company:", totalIncome);

    // Cross check if any income or transfer for this company went to an account for another company.
    const accounts = await prisma.account.findMany();
    const accountMap = {};
    accounts.forEach(a => accountMap[a.id] = a.companyId);

    for (const t of txns) {
        if (t.accountId && accountMap[t.accountId] !== companyId) {
            console.log(`Mismatch! Txn ${t.id} (${t.amount} ${t.type}) belongs to company ${companyId}, but Account ${t.accountId} belongs to company ${accountMap[t.accountId]}`);
        }
    }

}
trace190().finally(() => prisma.$disconnect());
