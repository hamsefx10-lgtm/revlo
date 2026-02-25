const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function check() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const transactions = await prisma.transaction.findMany({ where: { companyId } });

    let ledgerRunningScore = 0;

    let dashboardSumIncome = 0;
    let dashboardSumExpense = 0;
    let dashboardSumAssets = 0;

    for (const t of transactions) {
        const amt = Math.abs(Number(t.amount));

        // LEDGER LOGIC:
        if (t.accountId) {
            if (t.type === 'INCOME' || t.type === 'TRANSFER_IN' || t.type === 'DEBT_RECEIVED') {
                ledgerRunningScore += amt;
            } else if (t.type === 'EXPENSE' || t.type === 'TRANSFER_OUT' || t.type === 'DEBT_GIVEN' || t.type === 'DEBT_TAKEN') {
                ledgerRunningScore -= amt;
            } else if (t.type === 'DEBT_REPAID') {
                if (t.vendorId) ledgerRunningScore -= amt;
                else ledgerRunningScore += amt;
            } else if (t.type === 'OTHER') {
                ledgerRunningScore -= amt;
            }
        }

        // DASHBOARD LOGIC (What you see in UI):
        const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');
        if (t.type === 'INCOME' && !isAutoAdvance) {
            dashboardSumIncome += amt;
        } else if (t.type === 'DEBT_REPAID' && !t.vendorId) {
            dashboardSumIncome += amt;
        }

        if (t.type === 'EXPENSE' || t.type === 'DEBT_TAKEN' || t.type === 'DEBT_GIVEN' || (t.type === 'DEBT_REPAID' && t.vendorId)) {
            if (t.category !== 'FIXED_ASSET_PURCHASE') {
                dashboardSumExpense += amt;
            } else {
                dashboardSumAssets += amt;
            }
        }
    }

    // Dashboard Income includes Project Advances
    const projects = await prisma.project.findMany({ where: { companyId } });
    let sumProjectAdvances = 0;
    projects.forEach(p => {
        sumProjectAdvances += Number(p.advancePaid);
    });
    dashboardSumIncome += sumProjectAdvances;

    // Let's also check Auto-Advance transactions precisely for this company
    let sumAutoAdvancesTxn = 0;
    transactions.forEach(t => {
        if ((t.description || '').toLowerCase().includes('advance payment for project')) {
            sumAutoAdvancesTxn += Math.abs(Number(t.amount));
        }
    });

    const accounts = await prisma.account.findMany({ where: { companyId } });
    let realDbBalance = 0;
    accounts.forEach(a => realDbBalance += Number(a.balance));

    const report = {
        ledgerRunningScore,
        realDbBalance,
        dashboardExpected: dashboardSumIncome - dashboardSumExpense - dashboardSumAssets,
        discrepancy: ledgerRunningScore - (dashboardSumIncome - dashboardSumExpense - dashboardSumAssets),
        breakdowns: {
            sumAutoAdvancesTxn,
            sumProjectAdvances,
            autoAdvanceDiff: sumProjectAdvances - sumAutoAdvancesTxn
        }
    };

    fs.writeFileSync('birshiil-195k-full-trace.json', JSON.stringify(report, null, 2));
}

check().finally(() => prisma.$disconnect());
