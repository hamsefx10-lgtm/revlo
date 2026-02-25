const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function traceDifference() {
    const transactions = await prisma.transaction.findMany({
        include: {
            account: true,
            fromAccount: true,
            toAccount: true
        }
    });

    let dashboardIncome = 0;
    let dashboardExpense = 0;
    let dashboardAssets = 0;

    let runningAccountBalance = 0;

    let breakdown = {
        incomeTxns: 0,
        debtRepaidCustomer: 0,
        expenseTxns: 0,
        debtTaken: 0,
        debtGiven: 0,
        debtRepaidVendor: 0,
        fixedAssets: 0,
        debtReceived: 0,
        unbalancedTransfers: 0,
        other: 0,
    };

    for (const t of transactions) {
        const amt = Math.abs(Number(t.amount));

        const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');
        if (t.type === 'INCOME' && !isAutoAdvance) {
            dashboardIncome += amt;
            breakdown.incomeTxns += amt;
        } else if (t.type === 'DEBT_REPAID' && !t.vendorId) {
            dashboardIncome += amt;
            breakdown.debtRepaidCustomer += amt;
        }

        if (t.type === 'EXPENSE' || t.type === 'DEBT_TAKEN' || t.type === 'DEBT_GIVEN' || (t.type === 'DEBT_REPAID' && t.vendorId)) {
            if (t.category !== 'FIXED_ASSET_PURCHASE') {
                dashboardExpense += amt;
                if (t.type === 'EXPENSE') breakdown.expenseTxns += amt;
                if (t.type === 'DEBT_TAKEN') breakdown.debtTaken += amt;
                if (t.type === 'DEBT_GIVEN') breakdown.debtGiven += amt;
                if (t.type === 'DEBT_REPAID') breakdown.debtRepaidVendor += amt;
            } else {
                dashboardAssets += amt;
                breakdown.fixedAssets += amt;
            }
        }

        if (t.accountId) {
            if (t.type === 'INCOME' || t.type === 'TRANSFER_IN' || t.type === 'DEBT_RECEIVED') {
                runningAccountBalance += amt;
                if (t.type === 'DEBT_RECEIVED') breakdown.debtReceived += amt;
            } else if (t.type === 'EXPENSE' || t.type === 'TRANSFER_OUT' || t.type === 'DEBT_GIVEN' || t.type === 'DEBT_TAKEN') {
                runningAccountBalance -= amt;
            } else if (t.type === 'DEBT_REPAID') {
                if (t.vendorId) runningAccountBalance -= amt;
                else runningAccountBalance += amt;
            } else if (t.type === 'OTHER') {
                breakdown.other += amt;
                runningAccountBalance -= amt; // Treat OTHER as what?
            }
        }

        if (t.type === 'TRANSFER_IN') breakdown.unbalancedTransfers += amt;
        if (t.type === 'TRANSFER_OUT') breakdown.unbalancedTransfers -= amt;
    }

    const projects = await prisma.project.findMany();
    let projectAdvances = 0;
    projects.forEach(p => {
        projectAdvances += Number(p.advancePaid);
    });
    dashboardIncome += projectAdvances;

    const result = {
        dashboardIncome,
        dashboardExpense,
        dashboardAssets,
        dashboardExpectedBalance: dashboardIncome - dashboardExpense - dashboardAssets,
        trueLedgerFlow: runningAccountBalance,
        discrepancy: runningAccountBalance - (dashboardIncome - dashboardExpense - dashboardAssets),
        breakdown,
        projectAdvances
    };

    fs.writeFileSync('trace-results.json', JSON.stringify(result, null, 2));
}

traceDifference().finally(() => prisma.$disconnect());
