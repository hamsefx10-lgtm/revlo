const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditEBirr() {
    const eBirrId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';

    // Fetch transactions involving this account
    const allTx = await prisma.transaction.findMany({
        where: {
            OR: [
                { accountId: eBirrId },
                { fromAccountId: eBirrId },
                { toAccountId: eBirrId }
            ]
        },
        orderBy: [
            { transactionDate: 'asc' },
            { createdAt: 'asc' }
        ]
    });

    console.log(`Auditing E-Birr (${eBirrId}) - Found ${allTx.length} transactions`);

    let currentBalance = 0;

    allTx.forEach((trx, index) => {
        const amount = Math.abs(Number(trx.amount));

        const isStandardIn = [
            'INCOME',
            'DEBT_RECEIVED',
            'TRANSFER_IN'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

        const isStandardOut = [
            'EXPENSE',
            'DEBT_GIVEN',
            'DEBT_TAKEN',
            'TRANSFER_OUT'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && trx.vendorId);

        let change = 0;
        // Addition logic
        if ((trx.accountId === eBirrId && isStandardIn) || trx.toAccountId === eBirrId) {
            change += amount;
        }
        // Deduction logic
        if ((trx.accountId === eBirrId && isStandardOut) || trx.fromAccountId === eBirrId) {
            change -= amount;
        }

        currentBalance += change;

        // Show last 30 transactions
        if (index > allTx.length - 30) {
            console.log(`${trx.transactionDate.toISOString().slice(0, 10)} | Type: ${trx.type.padEnd(15)} | Amt: ${amount.toString().padStart(10)} | Change: ${change.toString().padStart(10)} | Bal: ${currentBalance.toFixed(2).padStart(12)} | Desc: ${trx.description}`);
        }
    });

    console.log('\nFinal Calculated Balance:', currentBalance.toFixed(2));

    const account = await prisma.account.findUnique({ where: { id: eBirrId } });
    console.log('Stored Account Balance:', account ? account.balance : 'NOT FOUND');
}

auditEBirr().catch(console.error).finally(() => prisma.$disconnect());
