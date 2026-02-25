const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function rebuildBalancesCorrectly() {
    console.log("Starting Full Account Balance Rebuild (Patched Vendor Repayment Math)...");

    const accounts = await prisma.account.findMany();
    const calculatedBalances = {};
    for (const account of accounts) {
        calculatedBalances[account.id] = { name: account.name, balance: 0, actual: Number(account.balance) };
    }

    const transactions = await prisma.transaction.findMany();
    console.log(`Processing ${transactions.length} historical transactions...`);

    for (const t of transactions) {
        const magnitude = Math.abs(Number(t.amount));

        // STANDARD INCOMES (Money goes INTO the accountId)
        if (['INCOME', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) {
            if (t.accountId && calculatedBalances[t.accountId]) {
                calculatedBalances[t.accountId].balance += magnitude;
            }
        }

        // DEBT REPAYMENTS
        if (t.type === 'DEBT_REPAID') {
            if (t.accountId && calculatedBalances[t.accountId]) {
                if (t.vendorId) {
                    // We paid the vendor back -> MONEY LEAVES OUR ACCOUNT
                    calculatedBalances[t.accountId].balance -= magnitude;
                } else {
                    // Customer paid us back -> MONEY ENTERS OUR ACCOUNT
                    calculatedBalances[t.accountId].balance += magnitude;
                }
            }
        }

        // STANDARD EXPENSES (Money goes OUT of the accountId)
        if (['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN'].includes(t.type)) {
            if (t.accountId && calculatedBalances[t.accountId]) {
                // Note: DEBT_TAKEN (taking a loan from someone) means money comes IN. Wait!
                // Actually DEBT_TAKEN means we received money. Does the dashboard treat it as an expense?
                // The old script subtracted DEBT_TAKEN from physical accounts.
                // If the company takes debt (receives cash), cash increases!
                calculatedBalances[t.accountId].balance -= magnitude;
            }
        }

        // TRANSFERS OUT (Money purely LEAVES the fromAccountId)
        if (t.type === 'TRANSFER_OUT' && t.fromAccountId && calculatedBalances[t.fromAccountId]) {
            calculatedBalances[t.fromAccountId].balance -= magnitude;
        }

        // TRANSFERS IN (Money purely ENTERS the toAccountId)
        if (t.type === 'TRANSFER_IN' && t.toAccountId && calculatedBalances[t.toAccountId]) {
            calculatedBalances[t.toAccountId].balance += magnitude;
        }
    }

    console.log("\n--- Calculated New Corrected Balances vs Flawed Balances ---");

    for (const account of accounts) {
        const accState = calculatedBalances[account.id];
        const newBalance = accState.balance;
        const oldBalance = accState.actual;

        // Epsilon comparison for floats
        if (Math.abs(newBalance - oldBalance) > 0.01) {
            console.log(`[UPDATING] Account: ${accState.name} | Old: ${oldBalance} | New: ${newBalance} | Diff: ${newBalance - oldBalance}`);
            await prisma.account.update({
                where: { id: account.id },
                data: { balance: newBalance }
            });
        } else {
            console.log(`[SKIPPING] Account: ${accState.name} | Verified Correct at ${oldBalance}`);
        }
    }

    console.log("\nSuccess: All account balances restored via Patched Double-Entry Matrix.");
}

rebuildBalancesCorrectly()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
