const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function targetedInvestigation() {
    let output = "=== TARGETED INVESTIGATION: CBE & E-BIRR ONLY ===\n";

    const targetAccountIds = [
        'c8306c05-5279-4b05-b5fc-dda41c793a77', // CBE
        '3c156507-ea0a-4974-8a54-92f1e9dd519a'  // E-Birr
    ];

    const accounts = await prisma.account.findMany({
        where: { id: { in: targetAccountIds } }
    });
    let totalStoredBalance = 0;
    output += "\n--- Targeted Accounts ---\n";
    accounts.forEach(acc => {
        const bal = Number(acc.balance);
        totalStoredBalance += bal;
        output += `- ${acc.name} (${acc.id}): ${bal.toLocaleString()} ETB\n`;
    });
    output += `TOTAL TARGETED BALANCE: ${totalStoredBalance.toLocaleString()} ETB\n`;

    const allTx = await prisma.transaction.findMany({
        where: {
            OR: [
                { accountId: { in: targetAccountIds } },
                { fromAccountId: { in: targetAccountIds } },
                { toAccountId: { in: targetAccountIds } }
            ]
        }
    });

    let totalInflow = 0;
    let totalOutflow = 0;

    allTx.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        if (trx.accountId === null) {
            if (targetAccountIds.includes(trx.fromAccountId) && targetAccountIds.includes(trx.toAccountId)) {
                totalInflow += amount;
                totalOutflow += amount;
            } else if (targetAccountIds.includes(trx.fromAccountId)) {
                totalOutflow += amount;
            } else if (targetAccountIds.includes(trx.toAccountId)) {
                totalInflow += amount;
            }
            return;
        }

        if (targetAccountIds.includes(trx.accountId)) {
            const isStandardIn = ['INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'OTHER'].includes(trx.type) ||
                (trx.type === 'DEBT_REPAID' && !trx.vendorId);
            const isStandardOut = ['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type) ||
                (trx.type === 'DEBT_REPAID' && trx.vendorId);

            if (isStandardIn) totalInflow += amount;
            if (isStandardOut) totalOutflow += amount;
        }
    });

    const netFlow = totalInflow - totalOutflow;

    output += "\n--- Targeted Transaction Summary ---\n";
    output += `Targeted Inflow: ${totalInflow.toLocaleString()} ETB\n`;
    output += `Targeted Outflow: ${totalOutflow.toLocaleString()} ETB\n`;
    output += `Targeted NET FLOW: ${netFlow.toLocaleString()} ETB\n`;

    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\targeted_audit.txt', output);
    console.log("Targeted Audit complete.");
}

targetedInvestigation().catch(console.error).finally(() => prisma.$disconnect());
