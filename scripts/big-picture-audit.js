const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function bigPictureAudit() {
    console.log("=== BIG PICTURE AUDIT ===");

    // 1. Sum of all Account Balances (The "Ground Truth" for Liquidity)
    const accounts = await prisma.account.findMany();
    const totalStoredBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    console.log(`Total Stored Balance (Sum of Accounts): ${totalStoredBalance.toLocaleString()} ETB`);

    // 2. Audit All Transactions using "Smart Logic"
    const allTx = await prisma.transaction.findMany();
    let calculatedNetFlow = 0;

    // We want to see the total NET FLOW of the entire system
    allTx.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));

        // Strategy: A transaction only changes the GLOBAL net flow if it's NOT a transfer.
        // Transfers are just moves between accounts, they don't change TOTAL money.

        if (trx.accountId === null) {
            // Unified Transfer: Net effect on GLOBAL balance is 0
            // (One account -X, another +X)
            return;
        }

        // For non-unified transactions (Legacy or Standard Incomes/Expenses)
        const isStandardIn = [
            'INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'OTHER'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId);

        const isStandardOut = [
            'EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && trx.vendorId);

        if (isStandardIn) {
            // Note: If it's a legacy TRANSFER_IN, it has an accountId.
            // In a global audit, we must be careful.
            // If we have TWO records (LEGACY), then TRANSFER_IN (+X) and TRANSFER_OUT (-X) will cancel out.
            calculatedNetFlow += amount;
        } else if (isStandardOut) {
            calculatedNetFlow -= amount;
        }
    });

    console.log(`Calculated Global Net Flow (Sum of all Tx): ${calculatedNetFlow.toLocaleString()} ETB`);
    console.log("-----------------------------------------");
    console.log("Note: Total Balance = Initial Balances + Net Flow.");
}

bigPictureAudit().catch(console.error).finally(() => prisma.$disconnect());
