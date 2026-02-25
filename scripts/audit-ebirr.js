const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkEBirr() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const eBirrAcc = await prisma.account.findFirst({
        where: { name: { contains: 'e-birr', mode: 'insensitive' }, companyId }
    });

    const txns = await prisma.transaction.findMany({
        where: {
            OR: [
                { accountId: eBirrAcc.id },
                { fromAccountId: eBirrAcc.id },
                { toAccountId: eBirrAcc.id }
            ],
            companyId
        },
        orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' }
        ]
    });

    let sumIn = 0;
    let sumOut = 0;
    let runningBal = 0;

    for (const t of txns) {
        const amount = Math.abs(Number(t.amount));

        if (t.accountId === eBirrAcc.id) {
            if (['INCOME', 'DEBT_REPAID', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) {
                runningBal += amount;
                sumIn += amount;
            } else {
                runningBal -= amount;
                sumOut += amount;
            }
        } else if (t.fromAccountId === eBirrAcc.id && t.type === 'TRANSFER_OUT') {
            runningBal -= amount;
            sumOut += amount;
        } else if (t.toAccountId === eBirrAcc.id && t.type === 'TRANSFER_IN') {
            runningBal += amount;
            sumIn += amount;
        } else {
            runningBal -= amount;
            sumOut += amount;
        }
    }

    console.log(`=== E-BIRR DIAGNOSTICS ===`);
    console.log(`Transactions Read: ${txns.length}`);
    console.log(`Total In: ${sumIn.toLocaleString()}`);
    console.log(`Total Out: ${sumOut.toLocaleString()}`);
    console.log(`Math Result (In - Out): ${(sumIn - sumOut).toLocaleString()}`);
    console.log(`Final Running Balance: ${runningBal.toLocaleString()}`);
    console.log(`Database Absolute Balance: ${Number(eBirrAcc.balance).toLocaleString()}`);
}

checkEBirr().finally(() => prisma.$disconnect());
