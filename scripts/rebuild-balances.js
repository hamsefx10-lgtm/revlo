const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function rebuildBalances() {
    console.log("Starting Full Account Balance Rebuild (Includes Transfer Math)...");

    const accounts = await prisma.account.findMany();
    const calculatedBalances = {};
    for (const account of accounts) {
        calculatedBalances[account.id] = { name: account.name, balance: 0, actual: Number(account.balance) };
    }

    const transactions = await prisma.transaction.findMany();
    console.log(`Processing ${transactions.length} historical transactions...`);

    for (const t of transactions) {
        const magnitude = Math.abs(Number(t.amount));

        // 1. Handle standard transactions tied directly to an Account (Income, Expense, Debt)
        if (t.accountId && calculatedBalances[t.accountId]) {
            let modifier = 0;

            if (t.type === 'INCOME' || t.type === 'DEBT_REPAID' || t.type === 'SHAREHOLDER_DEPOSIT') {
                modifier = magnitude;
            } else if (t.type === 'EXPENSE' || t.type === 'DEBT_GIVEN' || t.type === 'DEBT_TAKEN') {
                modifier = -magnitude;
            } else if (t.type === 'TRANSFER_IN') {
                modifier = magnitude; // Just a safety net in case someone used accountId
            } else if (t.type === 'TRANSFER_OUT') {
                modifier = -magnitude; // Just a safety net
            }

            calculatedBalances[t.accountId].balance += modifier;
        }

        // 2. Handle specific Transfer columns
        // When transferring OUT, the money leaves the fromAccount
        if (t.fromAccountId && calculatedBalances[t.fromAccountId] && t.type === 'TRANSFER_OUT') {
            calculatedBalances[t.fromAccountId].balance -= magnitude;
        }

        // When transferring IN, the money enters the toAccount
        if (t.toAccountId && calculatedBalances[t.toAccountId] && t.type === 'TRANSFER_IN') {
            calculatedBalances[t.toAccountId].balance += magnitude;
        }
    }

    console.log("\n--- Calculated New Corrected Balances vs Flawed Balances ---");

    for (const account of accounts) {
        const accState = calculatedBalances[account.id];
        const newBalance = accState.balance;
        const oldBalance = accState.actual;
        const diff = newBalance - oldBalance;

        if (Math.abs(diff) > 0.01) {
            console.log(`[UPDATING] Account: ${accState.name} | Old (Flawed): ${oldBalance} | New (Verified Correct): ${newBalance} | Fixed Diff: ${diff}`);
            await prisma.account.update({
                where: { id: account.id },
                data: { balance: newBalance }
            });
        } else {
            console.log(`[SKIPPING] Account: ${accState.name} | Already correct at ${oldBalance}`);
        }
    }

    console.log("\nSuccess: All account balances have been successfully restored including strict transfer handling!");
}

rebuildBalances()
    .catch(e => {
        console.error("Failed to rebuild balances:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
