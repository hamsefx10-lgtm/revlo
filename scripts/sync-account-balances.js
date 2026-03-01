
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncAllBalances() {
    console.log('Starting project-wide account balance synchronization...');

    const accounts = await prisma.account.findMany();

    for (const acc of accounts) {
        const id = acc.id;
        console.log(`Processing Account: ${acc.name} (${id})...`);

        const rawTransactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { accountId: id },
                    { fromAccountId: id },
                    { toAccountId: id }
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

            const isStandardIn = [
                'INCOME',
                'SHAREHOLDER_DEPOSIT',
                'DEBT_RECEIVED',
                'TRANSFER_IN'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

            const isStandardOut = [
                'EXPENSE',
                'DEBT_GIVEN',
                'DEBT_TAKEN',
                'TRANSFER_OUT'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && trx.vendorId);

            // Additions
            if ((trx.accountId === id && isStandardIn) || trx.toAccountId === id) {
                currentBalance += amount;
            }
            // Deductions
            if ((trx.accountId === id && isStandardOut) || trx.fromAccountId === id) {
                currentBalance -= amount;
            }
        });

        console.log(`  - Old Stored Balance: ${acc.balance}`);
        console.log(`  - New Calculated Balance: ${currentBalance}`);

        await prisma.account.update({
            where: { id: id },
            data: { balance: currentBalance }
        });

        console.log(`  - Updated!`);
    }

    console.log('Synchronization complete.');
}

syncAllBalances()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
