const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const cbeAcc = await prisma.account.findFirst({
        where: { name: { contains: 'CBE', mode: 'insensitive' }, companyId }
    });

    const txns = await prisma.transaction.findMany({
        where: {
            OR: [
                { accountId: cbeAcc.id },
                { fromAccountId: cbeAcc.id },
                { toAccountId: cbeAcc.id }
            ],
            companyId
        }
    });

    let amountFromAccount = 0;
    let amountToAccount = 0;

    txns.forEach(t => {
        if (t.fromAccountId === cbeAcc.id) amountFromAccount += Math.abs(Number(t.amount));
        if (t.toAccountId === cbeAcc.id) amountToAccount += Math.abs(Number(t.amount));
    });

    console.log("Transfers out using fromAccountId:", amountFromAccount);
    console.log("Transfers in using toAccountId:", amountToAccount);
}
check().finally(() => prisma.$disconnect());
