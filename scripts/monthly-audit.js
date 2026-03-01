const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function monthlyAudit() {
    let output = "=== MONTHLY AUDIT: FEBRUARY 2026 ===\n";

    const startOfMonth = new Date(2026, 1, 1);
    const endOfMonth = new Date(2026, 1, 28, 23, 59, 59);

    const txs = await prisma.transaction.findMany({
        where: {
            transactionDate: {
                gte: startOfMonth,
                lte: endOfMonth
            }
        }
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    txs.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

        const isStandardIn = [
            'INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'OTHER'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId) ||
            (trx.type === 'TRANSFER_OUT' && trx.accountId === null);

        const isStandardOut = ['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type) ||
            (trx.type === 'DEBT_REPAID' && trx.vendorId);

        if (isStandardIn) {
            if (!(trx.type === 'INCOME' && isAutoAdvance)) {
                totalInflow += amount;
            }
        }
        if (isStandardOut) {
            totalOutflow += amount;
        }
    });

    output += `February Inflow: ${totalInflow.toLocaleString()} ETB\n`;
    output += `February Outflow: ${totalOutflow.toLocaleString()} ETB\n`;
    output += `February NET FLOW: ${(totalInflow - totalOutflow).toLocaleString()} ETB\n`;

    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\monthly_audit.txt', output);
    console.log("Monthly Audit complete.");
}

monthlyAudit().catch(console.error).finally(() => prisma.$disconnect());
