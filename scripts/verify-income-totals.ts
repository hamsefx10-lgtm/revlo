
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const companyId = 'bf0c571a-6d60-496e-a3b0-272e259e83f5'; // I need to verify this company ID or get it from the DB

    // Get first company if ID is not known
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

    const totalsByType: Record<string, number> = {};
    transactions.forEach(trx => {
        const type = trx.type;
        totalsByType[type] = (totalsByType[type] || 0) + Number(trx.amount);
    });

    console.log("\nTotals by Transaction Type:");
    console.log(JSON.stringify(totalsByType, null, 2));

    // Check specifically for INCOME that might be auto-advances
    let incomeTotal = 0;
    let autoAdvanceTotal = 0;
    transactions.forEach(trx => {
        if (trx.type === 'INCOME') {
            const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');
            if (isAutoAdvance) autoAdvanceTotal += Number(trx.amount);
            else incomeTotal += Number(trx.amount);
        }
    });

    console.log(`\nIncome Breakdown:`);
    console.log(`- Real INCOME (non-auto): ${incomeTotal}`);
    console.log(`- Auto-Advance INCOME: ${autoAdvanceTotal}`);

    // Project Advance totals
    const projects = await prisma.project.findMany({ where: { companyId: cid } });
    const totalProjectAdvances = projects.reduce((sum, p) => sum + Number(p.advancePaid), 0);
    console.log(`\nTotal Project Advances (from Projects table): ${totalProjectAdvances}`);

    // Debt Repaid breakdown
    let debtRepaidVendor = 0;
    let debtRepaidCustomer = 0;
    transactions.forEach(trx => {
        if (trx.type === 'DEBT_REPAID') {
            if (trx.vendorId) debtRepaidVendor += Number(trx.amount);
            else debtRepaidCustomer += Number(trx.amount);
        }
    });
    console.log(`\nDebt Repaid Breakdown:`);
    console.log(`- Repaid to Vendor (Expense): ${debtRepaidVendor}`);
    console.log(`- Repaid from Customer (Income): ${debtRepaidCustomer}`);

    // Debt Received (In-flow)
    let debtReceived = 0;
    transactions.forEach(trx => {
        if (trx.type === 'DEBT_RECEIVED') debtReceived += Number(trx.amount);
    });
    console.log(`\nDebt Received (In-flow, normally loans): ${debtReceived}`);

    // Final Dashboard Income Calculation Logic
    const dashboardTotalIncome = totalProjectAdvances + incomeTotal + debtRepaidCustomer;
    console.log(`\n=> Calculated Dashboard Total Income: ${dashboardTotalIncome}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
