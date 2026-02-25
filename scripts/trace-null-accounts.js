const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceMissingAccount() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const transactions = await prisma.transaction.findMany({ where: { companyId } });

    let nullAccountTxns = [];
    for (const t of transactions) {
        if (!t.accountId) {
            nullAccountTxns.push(t);
        }
    }

    console.log("Txns with NULL accountId:", nullAccountTxns.length);
    nullAccountTxns.forEach(t => console.log(Math.abs(Number(t.amount)), t.type, t.description));
}

traceMissingAccount().finally(() => prisma.$disconnect());
