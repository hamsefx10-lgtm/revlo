const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function historicalAudit() {
    let output = "=== CORRECTED HISTORICAL AUDIT: CBE & E-BIRR ===\n";
    output += "(Matching logic in lib/accounting.ts)\n";

    const targetAccountIds = [
        'c8306c05-5279-4b05-b5fc-dda41c793a77', // CBE
        '3c156507-ea0a-4974-8a54-92f1e9dd519a'  // E-Birr
    ];

    for (const accId of targetAccountIds) {
        const account = await prisma.account.findUnique({ where: { id: accId } });
        output += `\n--- Account: ${account.name} (DB Balance: ${Number(account.balance).toLocaleString()}) ---\n`;

        const txs = await prisma.transaction.findMany({
            where: {
                OR: [
                    { accountId: accId },
                    { fromAccountId: accId },
                    { toAccountId: accId }
                ]
            },
            orderBy: [
                { transactionDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        let currentBalance = 0;

        txs.forEach((trx) => {
            const amount = Math.abs(Number(trx.amount));

            if (!trx.accountId) {
                if (trx.toAccountId === accId) {
                    currentBalance += amount;
                } else if (trx.fromAccountId === accId) {
                    currentBalance -= amount;
                }
                return;
            }

            if (trx.accountId !== accId) return;

            const isStandardIn = [
                'INCOME',
                'DEBT_RECEIVED',
                'TRANSFER_IN',
                'SHAREHOLDER_DEPOSIT'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

            const isStandardOut = [
                'EXPENSE',
                'DEBT_GIVEN',
                'DEBT_TAKEN',
                'TRANSFER_OUT'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && trx.vendorId);

            if (isStandardIn) {
                currentBalance += amount;
            } else if (isStandardOut) {
                currentBalance -= amount;
            }
        });

        output += `Final Calculated Balance: ${currentBalance.toLocaleString()} ETB\n`;
        output += `Difference (DB - Calculated): ${(Number(account.balance) - currentBalance).toLocaleString()} ETB\n`;
    }

    fs.writeFileSync('historical_audit_final.txt', output);
    console.log("Historical Audit Final complete.");
}

historicalAudit().catch(console.error).finally(() => prisma.$disconnect());
