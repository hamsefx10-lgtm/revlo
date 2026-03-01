
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get first company to analyze
    const company = await prisma.company.findFirst();
    if (!company) {
        console.log("No company found");
        return;
    }
    const cid = company.id;
    console.log(`Analyzing for company: ${company.name} (${cid})`);

    const transactions = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    const totalsByType = {};
    transactions.forEach(trx => {
        const type = trx.type;
        totalsByType[type] = (totalsByType[type] || 0) + parseFloat(trx.amount.toString());
    });

    console.log("\nTotals by Transaction Type:");
    console.log(JSON.stringify(totalsByType, null, 2));

    // Check specifically for INCOME that might be auto-advances
    let incomeTotal = 0;
    let autoAdvanceTotal = 0;
    transactions.forEach(trx => {
        if (trx.type === 'INCOME') {
            const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');
            if (isAutoAdvance) autoAdvanceTotal += parseFloat(trx.amount.toString());
            else incomeTotal += parseFloat(trx.amount.toString());
        }
    });

    console.log(`\nIncome Breakdown:`);
    console.log(`- Real INCOME (non-auto): ${incomeTotal}`);
    console.log(`- Auto-Advance INCOME: ${autoAdvanceTotal}`);

    // Project Advance totals
    const projects = await prisma.project.findMany({ where: { companyId: cid } });
    const totalProjectAdvances = projects.reduce((sum, p) => sum + parseFloat(p.advancePaid.toString()), 0);
    console.log(`\nTotal Project Advances (from Projects table): ${totalProjectAdvances}`);

    // Debt Repaid breakdown
    let debtRepaidVendor = 0;
    let debtRepaidCustomer = 0;
    transactions.forEach(trx => {
        if (trx.type === 'DEBT_REPAID') {
            if (trx.vendorId) debtRepaidVendor += parseFloat(trx.amount.toString());
            else debtRepaidCustomer += parseFloat(trx.amount.toString());
        }
    });
    console.log(`\nDebt Repaid Breakdown:`);
    console.log(`- Repaid to Vendor (Expense): ${debtRepaidVendor}`);
    console.log(`- Repaid from Customer (Income): ${debtRepaidCustomer}`);

    // Debt Received (In-flow)
    let debtReceived = 0;
    transactions.forEach(trx => {
        if (trx.type === 'DEBT_RECEIVED') debtReceived += parseFloat(trx.amount.toString());
    });
    console.log(`\nDebt Received (In-flow, normally loans): ${debtReceived}`);

    // Debt Taken (Out-flow per system logic)
    let debtTaken = 0;
    transactions.forEach(trx => {
        if (trx.type === 'DEBT_TAKEN') debtTaken += parseFloat(trx.amount.toString());
    });
    console.log(`\nDebt Given Out (DEBT_TAKEN type): ${debtTaken}`);

    // Final Dashboard Income Calculation Logic
    const dashboardTotalIncome = totalProjectAdvances + incomeTotal + debtRepaidCustomer;
    console.log(`\n=> Calculated Dashboard Total Income: ${dashboardTotalIncome}`);

    // Potential omitted income (Debt Received)
    if (debtReceived > 0) {
        console.log(`\n!!! WARNING: Debt Received (${debtReceived}) is NOT included in the Dashboard Total Income.`);
    }

    // Analyze if there are INCOME transactions with NO project
    const nonProjectIncome = transactions.filter(trx => trx.type === 'INCOME' && !trx.projectId)
        .reduce((sum, trx) => sum + parseFloat(trx.amount.toString()), 0);
    console.log(`\nNon-Project Income: ${nonProjectIncome}`);
    console.log(`(This IS included in the Dashboard but NOT in the P&L Project Income section)`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
