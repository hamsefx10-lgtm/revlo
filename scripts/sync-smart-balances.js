const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAll() {
    const accounts = await prisma.account.findMany();
    console.log(`Syncing ${accounts.length} accounts...`);

    for (const account of accounts) {
        const accountId = account.id;

        const rawTransactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { accountId: accountId },
                    { fromAccountId: accountId },
                    { toAccountId: accountId }
                ]
            },
            orderBy: [
                { transactionDate: 'asc' },
                { createdAt: 'asc' }
            ]
        });

        let currentBalance = 0;

        rawTransactions.forEach((trx) => {
            const amount = Math.abs(Number(trx.amount));

            // Logic copied from updated lib/accounting.ts
            if (!trx.accountId) {
                if (trx.toAccountId === accountId) {
                    currentBalance += amount;
                } else if (trx.fromAccountId === accountId) {
                    currentBalance -= amount;
                }
                return;
            }

            if (trx.accountId !== accountId) return;

            const isStandardIn = [
                'INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

            const isStandardOut = [
                'EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && trx.vendorId);

            if (isStandardIn) {
                currentBalance += amount;
            } else if (isStandardOut) {
                currentBalance -= amount;
            }
        });

        await prisma.account.update({
            where: { id: accountId },
            data: { balance: currentBalance }
        });
        console.log(`- ${account.name}: ${currentBalance.toFixed(2)}`);
    }
}

syncAll().catch(console.error).finally(() => prisma.$disconnect());
