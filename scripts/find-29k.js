const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
    const txs = await prisma.transaction.findMany({ include: { vendor: true, customer: true, project: true } });
    const badTxs = txs.filter(t => Number(t.amount) === 29000 || Number(t.amount) === -29000);

    const exps = await prisma.expense.findMany({ include: { vendor: true, customer: true, project: true } });
    const badExps = exps.filter(e => Number(e.amount) === 29000 || Number(e.amount) === -29000);

    fs.writeFileSync('bad-29k.json', JSON.stringify({ txs: badTxs, expenses: badExps }, null, 2));
}
main().finally(() => typeof window !== 'undefined' ? undefined : prisma.$disconnect());
