const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function check() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const transactions = await prisma.transaction.findMany({ where: { companyId } });

    let discrepancyBreakdown = {
        transfersIn: 0,
        transfersOut: 0,
        debtReceived: 0,
        other: 0,
        uncountedTxns: []
    };

    for (const t of transactions) {
        const amt = Math.abs(Number(t.amount));

        // Items that modify account balance but NOT dashboard Income/Expense
        if (t.type === 'TRANSFER_IN') {
            discrepancyBreakdown.transfersIn += amt;
        } else if (t.type === 'TRANSFER_OUT') {
            discrepancyBreakdown.transfersOut -= amt;
        } else if (t.type === 'DEBT_RECEIVED') {
            discrepancyBreakdown.debtReceived += amt;
            discrepancyBreakdown.uncountedTxns.push(t);
        } else if (t.type === 'OTHER') {
            discrepancyBreakdown.other += amt;
            discrepancyBreakdown.uncountedTxns.push(t);
        }
    }

    discrepancyBreakdown.netTransfers = discrepancyBreakdown.transfersIn + discrepancyBreakdown.transfersOut;

    fs.writeFileSync('birshiil-195k-trace.json', JSON.stringify(discrepancyBreakdown, null, 2));
}

check().finally(() => prisma.$disconnect());
