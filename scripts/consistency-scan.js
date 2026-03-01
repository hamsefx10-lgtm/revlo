const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function consistencyScan() {
    let output = "=== FINAL CONSISTENCY SCAN (POST-FIX) ===\n";

    // 1. Total Stored Balance
    const accounts = await prisma.account.findMany();
    const totalStored = accounts.reduce((s, a) => s + Number(a.balance), 0);
    output += `Total Stored Account Balance: ${totalStored.toLocaleString()} ETB\n`;

    // 2. Gross Inflow/Outflow (FIXED LOGIC)
    const txs = await prisma.transaction.findMany();
    const allProj = await prisma.project.findMany();
    const totalProjAdv = allProj.reduce((s, p) => s + Number(p.advancePaid), 0);

    let inflow = totalProjAdv;
    let outflow = 0;

    txs.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

        const isUnifiedTransfer = trx.accountId === null && (trx.fromAccountId || trx.toAccountId);
        const isGhost = trx.accountId === null && !isUnifiedTransfer;

        if (!isGhost) {
            const isStandardIn = [
                'INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'OTHER'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId) ||
                (trx.type === 'TRANSFER_OUT' && trx.accountId === null);

            const isStandardOut = ['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type) ||
                (trx.type === 'DEBT_REPAID' && trx.vendorId);

            if (isStandardIn && !(trx.type === 'INCOME' && isAutoAdvance)) {
                inflow += amount;
            }
            if (isStandardOut) {
                outflow += amount;
            }
        }
    });

    const netFlow = inflow - outflow;
    output += `Calculated Global Inflow: ${inflow.toLocaleString()} ETB\n`;
    output += `Calculated Global Outflow: ${outflow.toLocaleString()} ETB\n`;
    output += `Calculated Global Net Flow: ${netFlow.toLocaleString()} ETB\n`;

    output += `\nFinal Discrepancy (Balance - Net Flow): ${(totalStored - netFlow).toLocaleString()} ETB\n`;

    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\consistency_scan.txt', output);
    console.log("Done.");
}

consistencyScan().catch(console.error).finally(() => prisma.$disconnect());
