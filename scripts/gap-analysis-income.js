
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // Birshiil

    const allTransactions = await prisma.transaction.findMany({
        where: { companyId }
    });

    // Categories of inflows
    const reportIncomeTypes = ['INCOME', 'DEBT_REPAID']; // What the dashboard counts
    let dashboardSum = 0;

    const categories = {
        countedInIncome: [],
        transferIn: [],
        debtReceived: [],
        shareholderDeposit: [],
        otherCredits: []
    };

    allTransactions.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        const desc = (trx.description || '').toLowerCase();
        const isAutoAdvance = desc.includes('advance payment for project');

        // Logic from reports API
        if (trx.type === 'INCOME') {
            if (!isAutoAdvance) {
                dashboardSum += amount;
                categories.countedInIncome.push(trx);
            } else {
                // This is counted via Projects table sum in the API
                // but for transparency let's track it
                categories.countedInIncome.push(trx);
            }
        } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
            dashboardSum += amount;
            categories.countedInIncome.push(trx);
        }
        // Now identify what is NOT counted in Income but increases Balance
        else if (trx.type === 'TRANSFER_IN') {
            categories.transferIn.push(trx);
        } else if (trx.type === 'DEBT_RECEIVED') {
            categories.debtReceived.push(trx);
        } else if (trx.type === 'SHAREHOLDER_DEPOSIT') {
            categories.shareholderDeposit.push(trx);
        } else if (amount > 0 && !['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type)) {
            // Catch-all for other positive transactions
            categories.otherCredits.push(trx);
        }
    });

    console.log("--- Gap Analysis: Dashboard Income vs Account Inflows ---");

    const sum = (list) => list.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    console.log(`\n1. DASHBOARD INCOME (OPERATING):`);
    console.log(`   - Counted Items: ${categories.countedInIncome.length}`);
    // Note: The real dashboard adds Project table advances, but here we see transaction coverage

    console.log(`\n2. MISSED INFLOWS (ACCOUNTS PAGE ONLY):`);
    console.log(`   - TRANSFER_IN: ${categories.transferIn.length} transactions, Total: ${sum(categories.transferIn)}`);
    console.log(`   - DEBT_RECEIVED (Loans): ${categories.debtReceived.length} transactions, Total: ${sum(categories.debtReceived)}`);
    console.log(`   - SHAREHOLDER_DEPOSIT: ${categories.shareholderDeposit.length} transactions, Total: ${sum(categories.shareholderDeposit)}`);
    console.log(`   - OTHERS: ${categories.otherCredits.length} transactions, Total: ${sum(categories.otherCredits)}`);

    if (categories.debtReceived.length > 0) {
        console.log("\nSample DEBT_RECEIVED (Missed by Dashboard):");
        categories.debtReceived.slice(0, 5).forEach(t => console.log(`  - ${t.description}: ${t.amount}`));
    }

    if (categories.otherCredits.length > 0) {
        console.log("\nSample OTHER CREDITS (Missed by Dashboard):");
        categories.otherCredits.slice(0, 5).forEach(t => console.log(`  - ${t.type} - ${t.description}: ${t.amount}`));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
