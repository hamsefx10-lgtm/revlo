
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // 1. Project-based advance totals (Source 1)
    const projectsAdvance = await prisma.project.aggregate({
        _sum: { advancePaid: true },
        where: { companyId: cid }
    });
    const totalProjectAdvances = parseFloat(projectsAdvance._sum.advancePaid || 0);

    // 2. Transaction-based totals (Source 2)
    const allTransactions = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    let totalIncomeFromTransactions = 0;
    let autoAdvanceExcluded = 0;
    let ignoredTypes_DebtReceived = 0;
    let ignoredTypes_TransferIn = 0;

    allTransactions.forEach(trx => {
        const amount = Math.abs(parseFloat(trx.amount.toString()));
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

        if (trx.type === 'INCOME') {
            if (isAutoAdvance) {
                autoAdvanceExcluded += amount;
            } else {
                totalIncomeFromTransactions += amount;
            }
        } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
            totalIncomeFromTransactions += amount;
        } else if (trx.type === 'DEBT_RECEIVED') {
            ignoredTypes_DebtReceived += amount;
        } else if (trx.type === 'TRANSFER_IN') {
            ignoredTypes_TransferIn += amount;
        }
    });

    console.log(`Company: Birshiil (${cid})`);
    console.log(`-----------------------------------`);
    console.log(`Source 1: totalProjectAdvances (from Table): ${totalProjectAdvances}`);
    console.log(`Source 2: Income from Transactions: ${totalIncomeFromTransactions}`);
    console.log(`Source 2 Detail: Auto-Advance INCOME (Excluded): ${autoAdvanceExcluded}`);
    console.log(`-----------------------------------`);
    console.log(`=> REPLICATED DASHBOARD TOTAL INCOME: ${totalProjectAdvances + totalIncomeFromTransactions}`);
    console.log(`Target: 14189032`);
    console.log(`DIFFERENCE: ${(totalProjectAdvances + totalIncomeFromTransactions) - 14189032}`);

    console.log(`\nPotential "Missing" In-flows (Not in Income):`);
    console.log(`- DEBT_RECEIVED (Loans/Amaah la qaatay): ${ignoredTypes_DebtReceived}`);
    console.log(`- TRANSFER_IN: ${ignoredTypes_TransferIn}`);

    // Check for any TRANSACTION that has NO companyId or different cid? (Unlikely)

}

main().catch(console.error).finally(() => prisma.$disconnect());
