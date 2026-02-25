const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEbirrTrueBalance() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const acc = await prisma.account.findFirst({
        where: { name: { contains: 'e-birr', mode: 'insensitive' }, companyId }
    });

    const allTxns = await prisma.transaction.findMany({
        where: {
            OR: [
                { accountId: acc.id },
                { fromAccountId: acc.id },
                { toAccountId: acc.id }
            ],
            companyId
        }
    });

    let mathRunningBal = 0;

    for (const t of allTxns) {
        const amt = Math.abs(Number(t.amount));

        // Standard Txn
        if (t.accountId === acc.id && !t.fromAccountId && !t.toAccountId) {
            if (['INCOME', 'DEBT_REPAID', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) mathRunningBal += amt;
            else mathRunningBal -= amt;
        }

        // Transfers leaving Ebirr
        if (t.fromAccountId === acc.id && t.type === 'TRANSFER_OUT') mathRunningBal -= amt;

        // Transfers entering Ebirr
        if (t.toAccountId === acc.id && t.type === 'TRANSFER_IN') mathRunningBal += amt;
    }

    console.log('Math calculated True Bal:', mathRunningBal);
    console.log('Database Hardcoded Bal:', Number(acc.balance));

    if (mathRunningBal === Number(acc.balance)) {
        console.log('Result: Matches perfectly!');
    } else {
        console.log('Result: Discrepancy Found:', mathRunningBal - Number(acc.balance));
    }
}

checkEbirrTrueBalance().finally(() => prisma.$disconnect());
