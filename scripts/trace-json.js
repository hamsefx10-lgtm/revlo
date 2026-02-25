const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function traceMissingEbirr() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const eBirrAcc = await prisma.account.findFirst({
        where: { name: { contains: 'e-birr', mode: 'insensitive' }, companyId }
    });
    const cbeAcc = await prisma.account.findFirst({
        where: { name: { contains: 'CBE', mode: 'insensitive' }, companyId }
    });

    const allTxns = await prisma.transaction.findMany({
        where: { companyId },
        include: {
            fromAccount: { select: { name: true } },
            toAccount: { select: { name: true } },
            account: { select: { name: true } }
        }
    });

    const output = {
        cbeToEbirrTransfers: [],
        cbeToSomewhereElse: []
    };

    for (const t of allTxns) {
        const amt = Math.abs(Number(t.amount));

        if (t.fromAccountId === cbeAcc.id && t.toAccountId === eBirrAcc.id) {
            output.cbeToEbirrTransfers.push({
                id: t.id,
                amount: amt,
                date: t.transactionDate,
                desc: t.description
            });
        }

        if (t.fromAccountId === cbeAcc.id && t.type === 'TRANSFER_OUT' && t.toAccountId !== eBirrAcc.id) {
            output.cbeToSomewhereElse.push({
                id: t.id,
                amount: amt,
                toId: t.toAccountId,
                toName: t.toAccount ? t.toAccount.name : 'Unknown',
                desc: t.description
            });
        }
    }

    fs.writeFileSync('ebirr-trace.json', JSON.stringify(output, null, 2));
    console.log("Wrote trace to ebirr-trace.json");
}
traceMissingEbirr().finally(() => prisma.$disconnect());
