const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function traceDashboardMismatch() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const allTxns = await prisma.transaction.findMany({ where: { companyId } });

    let dashboardIncome = 0;
    let dashboardExpense = 0;

    let unrecognizedPositive = 0;
    let unrecognizedNegative = 0;

    let unrecognizedList = [];

    for (const trx of allTxns) {
        const amt = Math.abs(Number(trx.amount));
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

        let matchedIncome = false;
        let matchedExpense = false;

        // Dashboard Income Tracker
        if (trx.type === 'INCOME' && !isAutoAdvance) {
            dashboardIncome += amt;
            matchedIncome = true;
        } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
            dashboardIncome += amt;
            matchedIncome = true;
        }

        // Dashboard Expense Tracker
        if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN'].includes(trx.type) || (trx.type === 'DEBT_REPAID' && trx.vendorId)) {
            dashboardExpense += amt;
            matchedExpense = true;
        }

        // If it doesn't match Dashboard's view, let's see what impact it had on the true Db Balance
        if (!matchedIncome && !matchedExpense) {
            if (['TRANSFER_IN', 'TRANSFER_OUT'].includes(trx.type)) {
                // Transfers theoretically should net to zero globally so we can skip them
            } else if (trx.type === 'INCOME' && isAutoAdvance) {
                // Handled by Project Advances directly in the API
            } else {
                if (['SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED'].includes(trx.type)) {
                    unrecognizedPositive += amt;
                    unrecognizedList.push({ type: trx.type, amount: amt, desc: trx.description });
                } else {
                    unrecognizedList.push({ type: trx.type, amount: amt, desc: trx.description, note: 'Unknown generic' });
                }
            }
        }
    }

    const allProjectsAdvanceResult = await prisma.project.aggregate({
        _sum: { advancePaid: true },
        where: { companyId }
    });
    const projectAdvances = allProjectsAdvanceResult._sum.advancePaid ? Number(allProjectsAdvanceResult._sum.advancePaid) : 0;

    dashboardIncome += projectAdvances;

    console.log(`Calculated Dashboard Income: ${dashboardIncome}`);
    console.log(`Calculated Dashboard Expense: ${dashboardExpense}`);
    console.log(`Expected Math Balance: ${dashboardIncome - dashboardExpense}`);

    const totalBalanceResult = await prisma.account.aggregate({
        _sum: { balance: true },
        where: { companyId },
    });
    const dbBalance = Number(totalBalanceResult._sum.balance) || 0;
    console.log(`Actual Database Balance: ${dbBalance}`);
    console.log(`Difference (Unaccounted): ${dbBalance - (dashboardIncome - dashboardExpense)}`);

    console.log(`\nUnaccounted Positives in Ledger: ${unrecognizedPositive}`);
    console.log('Unrecognized Items:', unrecognizedList);

}
traceDashboardMismatch().finally(() => prisma.$disconnect());
