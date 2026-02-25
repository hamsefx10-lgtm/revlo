const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDebts() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const allTxns = await prisma.transaction.findMany({ where: { companyId } });

    let debtTaken = 0;
    let debtGiven = 0;
    let debtRepaid = 0;
    let debtReceived = 0;

    for (const t of allTxns) {
        if (t.type === 'DEBT_TAKEN') debtTaken += Math.abs(Number(t.amount));
        if (t.type === 'DEBT_GIVEN') debtGiven += Math.abs(Number(t.amount));
        if (t.type === 'DEBT_REPAID') debtRepaid += Math.abs(Number(t.amount));
        if (t.type === 'DEBT_RECEIVED') debtReceived += Math.abs(Number(t.amount));
    }

    console.log('DEBT_TAKEN Sum:', debtTaken);
    console.log('DEBT_GIVEN Sum:', debtGiven);
    console.log('DEBT_REPAID Sum:', debtRepaid);
    console.log('DEBT_RECEIVED Sum:', debtReceived);
}

checkDebts().finally(() => prisma.$disconnect());
