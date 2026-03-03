import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllAccounts() {
    console.log("Fetching all accounts associated with the system...");

    const accounts = await prisma.account.findMany({
        include: {
            transactions: {
                orderBy: { transactionDate: 'asc' }
            }
        }
    });

    console.log(`Found ${accounts.length} accounts to process.\n`);

    for (const account of accounts) {
        let runningBalance = 0;

        for (const trx of account.transactions) {
            const amountStr = typeof (trx.amount as any).toNumber === 'function' ? (trx.amount as any).toNumber() : Number(trx.amount);
            const amount = Math.abs(amountStr);
            let multiplier = 0;

            const isStandardIn = [
                'INCOME',
                'DEBT_RECEIVED',
                'TRANSFER_IN'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !!trx.customerId);

            const isStandardOut = [
                'EXPENSE',
                'DEBT_GIVEN',
                'DEBT_TAKEN',
                'TRANSFER_OUT'
            ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.customerId);

            if (isStandardIn) multiplier = 1;
            if (isStandardOut) multiplier = -1;

            runningBalance += (amount * multiplier);
        }

        const oldBalance = typeof (account.balance as any).toNumber === 'function' ? (account.balance as any).toNumber() : Number(account.balance);

        if (Math.abs(oldBalance - runningBalance) > 0.01) {
            console.log(`[FIXING] ${account.name} (ID: ${account.id})`);
            console.log(`         Old Balance: ${oldBalance}`);
            console.log(`         New Balance: ${runningBalance}`);

            await prisma.account.update({
                where: { id: account.id },
                data: { balance: runningBalance }
            });
            console.log(`         -> Fixed successfully.\n`);
        } else {
            console.log(`[OK] ${account.name} is already perfectly balanced (${runningBalance}).`);
        }
    }

    console.log("\nAll accounts have been recalculated and fixed!");
}

fixAllAccounts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
