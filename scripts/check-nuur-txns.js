const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNuurTransactions() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const projectId = '2970784b-8a6f-415e-a0cd-a6d3e1177801';

    const txns = await prisma.transaction.findMany({
        where: { projectId },
        include: { account: true }
    });

    console.log(`\nTransactions for Nuur Moalin Site:`);
    for (const t of txns) {
        if (['INCOME', 'DEBT_REPAID'].includes(t.type)) {
            console.log(`- Type: ${t.type} | Amount: ${t.amount} | Date: ${t.transactionDate.toISOString().split('T')[0]} | Desc: "${t.description}" | Account: ${t.account ? t.account.name : 'NULL'}`);
        }
    }
}
checkNuurTransactions().finally(() => prisma.$disconnect());
