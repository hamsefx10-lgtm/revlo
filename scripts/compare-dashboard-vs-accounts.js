
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // Birshiil

    const allTransactions = await prisma.transaction.findMany({
        where: { companyId }
    });

    let dashboardIncome = 0; // INCOME + DEBT_REPAID (cust)
    let accountLevelIncome = 0; // INCOME + DEBT_REPAID + TRANSFER_IN + SHAREHOLDER_DEPOSIT
    let transferInSum = 0;
    let shareholderDepositSum = 0;

    allTransactions.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));

        // Dashboard Logic (excluding auto-advances check, but summing all for comparison)
        if (trx.type === 'INCOME') {
            dashboardIncome += amount;
        } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
            dashboardIncome += amount;
        }

        // Account Level Logic (anything that increases a balance)
        if (['INCOME', 'DEBT_REPAID', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(trx.type)) {
            accountLevelIncome += amount;
        }

        if (trx.type === 'TRANSFER_IN') transferInSum += amount;
        if (trx.type === 'SHAREHOLDER_DEPOSIT') shareholderDepositSum += amount;
    });

    console.log(`- Dashboard Total Income (Revenue): ${dashboardIncome}`);
    console.log(`- Account-Level Total Credits: ${accountLevelIncome}`);
    console.log(`- Discrepancy (Transfers + Deposits): ${accountLevelIncome - dashboardIncome}`);
    console.log(`  - TRANSFER_IN Sum: ${transferInSum}`);
    console.log(`  - SHAREHOLDER_DEPOSIT Sum: ${shareholderDepositSum}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
