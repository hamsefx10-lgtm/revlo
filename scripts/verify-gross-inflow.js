
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // Birshiil

    // 1. Get stats from our new API logic (via script simulation)
    const transactions = await prisma.transaction.findMany({ where: { companyId } });
    const advances = await prisma.project.aggregate({
        where: { companyId },
        _sum: { advancePaid: true }
    });

    const totalAdvances = Number(advances._sum.advancePaid || 0);
    let calcInflow = totalAdvances;

    transactions.forEach(t => {
        const amount = Math.abs(Number(t.amount));
        const desc = (t.description || '').toLowerCase();
        const isAuto = desc.includes('advance payment for project');

        if (['INCOME', 'DEBT_REPAID', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED'].includes(t.type)) {
            if (!(t.type === 'INCOME' && isAuto)) {
                calcInflow += amount;
            }
        }
    });

    // 2. Cross-verify with total credits to accounts
    // We can't easily sum 'credits' without knowing which side is which, 
    // but we can sum all positive transaction amounts recorded in the DB.
    let dbPositiveSum = 0;
    transactions.forEach(t => {
        if (Number(t.amount) > 0) dbPositiveSum += Number(t.amount);
    });

    console.log(`--- Verification Case: Birshiil ---`);
    console.log(`API Calculated Gross Inflow: ${calcInflow.toLocaleString()}`);
    console.log(`Database Raw Positive Sum:   ${dbPositiveSum.toLocaleString()}`);

    // They should be very close, but API calc includes Project Advances which might be off-transaction
    console.log(`\nNote: API Inflow includes Project Advances (${totalAdvances}) instead of just INCOME transactions.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
