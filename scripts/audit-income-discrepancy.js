
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // Birshiil

    // 1. Calculation method used in /api/projects/accounting/reports
    const projects = await prisma.project.aggregate({
        _sum: { advancePaid: true },
        where: { companyId }
    });
    const totalProjectAdvances = Number(projects._sum.advancePaid || 0);

    const allTransactions = await prisma.transaction.findMany({
        where: { companyId }
    });

    let reportTotalIncome = totalProjectAdvances;
    let manualTrxIncome = 0;
    let autoAdvanceTrxIncome = 0;
    let debtRepaidIncome = 0;
    let incomeDoubleCounts = 0;

    allTransactions.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        const desc = (trx.description || '').toLowerCase();
        const isAutoAdvance = desc.includes('advance payment for project');

        if (trx.type === 'INCOME') {
            if (!isAutoAdvance) {
                reportTotalIncome += amount;
                manualTrxIncome += amount;
            } else {
                autoAdvanceTrxIncome += amount;
            }
        } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
            reportTotalIncome += amount;
            debtRepaidIncome += amount;
        }
    });

    console.log("--- Accounting Reports Logic (Mixed Method) ---");
    console.log(`- Project Advances (Table Sum): ${totalProjectAdvances}`);
    console.log(`- Manual INCOME Transactions: ${manualTrxIncome}`);
    console.log(`- DEBT_REPAID (Customer): ${debtRepaidIncome}`);
    console.log(`=> FINAL APP TOTAL INCOME: ${reportTotalIncome}`);

    console.log("\n--- Transaction-Only Audit ---");
    const pureIncomeTrx = allTransactions.filter(t => t.type === 'INCOME');
    const pureIncomeSum = pureIncomeTrx.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    console.log(`- Sum of ALL 'INCOME' Transactions: ${pureIncomeSum}`);
    console.log(`- Sum of ALL 'DEBT_REPAID' (Cust): ${debtRepaidIncome}`);
    console.log(`=> TOTAL PURE TRANSACTIONS: ${pureIncomeSum + debtRepaidIncome}`);

    console.log("\n--- Comparison ---");
    console.log(`Difference (Mixed - Pure): ${reportTotalIncome - (pureIncomeSum + debtRepaidIncome)}`);

    // Investigation: Are there auto-advances that DON'T match the string?
    const incomeWithoutString = allTransactions.filter(t =>
        t.type === 'INCOME' &&
        !t.description.toLowerCase().includes('advance payment for project') &&
        t.projectId !== null
    );
    console.log(`\nPotential Project Advances NOT labeled 'advance payment for project': ${incomeWithoutString.length}`);
    incomeWithoutString.slice(0, 5).forEach(t => {
        console.log(`  - ProjectID: ${t.projectId}, Amt: ${t.amount}, Desc: ${t.description}`);
    });

    // Check Account Balances sum
    const accountSum = await prisma.account.aggregate({
        _sum: { balance: true },
        where: { companyId }
    });
    console.log(`\nSum of all Account Balances: ${Number(accountSum._sum.balance || 0)}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
