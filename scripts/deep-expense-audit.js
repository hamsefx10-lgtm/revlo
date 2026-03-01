
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const allTransactions = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    let totalExpenses = 0;
    let fixedAssetExpenses = 0;
    let debtTaken = 0;
    let debtGiven = 0;
    let debtRepaidVendor = 0;
    let normalExpenses = 0;
    let transferOut = 0;

    allTransactions.forEach(trx => {
        const amount = Math.abs(parseFloat(trx.amount.toString()));

        if (trx.type === 'EXPENSE') {
            if (trx.category === 'FIXED_ASSET_PURCHASE') {
                fixedAssetExpenses += amount;
            } else {
                normalExpenses += amount;
                totalExpenses += amount;
            }
        } else if (trx.type === 'DEBT_TAKEN') {
            debtTaken += amount;
            totalExpenses += amount;
        } else if (trx.type === 'DEBT_GIVEN') {
            debtGiven += amount;
            totalExpenses += amount;
        } else if (trx.type === 'DEBT_REPAID' && trx.vendorId) {
            debtRepaidVendor += amount;
            totalExpenses += amount;
        } else if (trx.type === 'TRANSFER_OUT') {
            transferOut += amount;
        }
    });

    console.log(`Expense Audit for Birshiil (${cid})`);
    console.log(`-----------------------------------`);
    console.log(`Normal Expenses (OpEx): ${normalExpenses}`);
    console.log(`DEBT_TAKEN (Loans given): ${debtTaken}`);
    console.log(`DEBT_GIVEN: ${debtGiven}`);
    console.log(`DEBT_REPAID (to Vendors): ${debtRepaidVendor}`);
    console.log(`-----------------------------------`);
    console.log(`=> REPLICATED DASHBOARD TOTAL EXPENSES: ${totalExpenses}`);
    console.log(`-----------------------------------`);
    console.log(`Excluded from Total Expenses:`);
    console.log(`- FIXED_ASSET_PURCHASE: ${fixedAssetExpenses}`);
    console.log(`- TRANSFER_OUT: ${transferOut}`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
