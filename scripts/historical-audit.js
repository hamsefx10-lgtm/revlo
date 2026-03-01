const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function historicalAudit() {
    let output = "=== HISTORICAL AUDIT: CBE & E-BIRR ===\n";

    const targetAccountIds = [
        'c8306c05-5279-4b05-b5fc-dda41c793a77', // CBE
        '3c156507-ea0a-4974-8a54-92f1e9dd519a'  // E-Birr
    ];

    for (const accId of targetAccountIds) {
        const account = await prisma.account.findUnique({ where: { id: accId } });
        output += `\n--- Account: ${account.name} (${accId}) ---\n`;
        output += `Current DB Balance: ${Number(account.balance).toLocaleString()} ETB\n`;

        const txs = await prisma.transaction.findMany({
            where: {
                OR: [
                    { accountId: accId },
                    { fromAccountId: accId },
                    { toAccountId: accId }
                ]
            },
            orderBy: { transactionDate: 'asc' }
        });

        let runningBalance = 0;
        output += "Date       | Type            | Amount    | Running Bal\n";
        output += "-----------|-----------------|-----------|------------\n";

        txs.forEach(trx => {
            const amount = Number(trx.amount);
            let change = 0;

            if (trx.accountId === accId) {
                // Determine direction based on type
                const isPositive = ['INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'OTHER'].includes(trx.type) ||
                    (trx.type === 'DEBT_REPAID' && !trx.vendorId);
                change = isPositive ? amount : -amount;
            } else if (trx.fromAccountId === accId) {
                change = -amount;
            } else if (trx.toAccountId === accId) {
                change = amount;
            }

            runningBalance += change;
            output += `${trx.transactionDate.toISOString().split('T')[0]} | ${trx.type.padEnd(15)} | ${amount.toString().padStart(9)} | ${runningBalance.toLocaleString()}\n`;
        });

        output += `\nFinal Calculated Running Balance: ${runningBalance.toLocaleString()} ETB\n`;
        output += `Difference (DB - Calculated): ${(Number(account.balance) - runningBalance).toLocaleString()} ETB\n`;
    }

    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\historical_audit.txt', output);
    console.log("Historical Audit complete.");
}

historicalAudit().catch(console.error).finally(() => prisma.$disconnect());
