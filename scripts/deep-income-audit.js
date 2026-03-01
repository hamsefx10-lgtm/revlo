
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const projects = await prisma.project.findMany({
        where: { companyId: cid },
        include: {
            transactions: {
                where: { type: 'DEBT_REPAID' }
            }
        }
    });

    console.log(`Deep Analysis for Birshiil (${cid})\n`);

    let totalTableAdvance = 0;
    let totalTxRepaid = 0;

    projects.forEach(p => {
        const adv = parseFloat(p.advancePaid.toString());
        const tx = p.transactions.reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
        totalTableAdvance += adv;
        totalTxRepaid += tx;

        if (tx > 0) {
            console.log(`Project: ${p.name}`);
            console.log(`- advancePaid in Table: ${adv}`);
            console.log(`- DEBT_REPAID transactions: ${tx}`);
            console.log(`- Potential Overcount: ${Math.min(adv, tx)} (if advancePaid includes these transactions)`);
        }
    });

    console.log(`\nTotals over all projects:`);
    console.log(`- Sum of advancePaid in Table: ${totalTableAdvance}`);
    console.log(`- Sum of DEBT_REPAID transactions linked to projects: ${totalTxRepaid}`);

    // Check for DEBT_RECEIVED
    const debtReceived = await prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { companyId: cid, type: 'DEBT_RECEIVED' }
    });
    console.log(`\nDEBT_RECEIVED Total (Missed Income): ${parseFloat(debtReceived._sum.amount || 0)}`);

    // Check for INCOME transactions NOT matching exclusion
    const incomeTransactions = await prisma.transaction.findMany({
        where: { companyId: cid, type: 'INCOME' }
    });

    let realIncome = 0;
    let autoAdvanceDetected = 0;
    incomeTransactions.forEach(t => {
        const isAuto = (t.description || '').toLowerCase().includes('advance payment for project');
        if (isAuto) autoAdvanceDetected += parseFloat(t.amount.toString());
        else realIncome += parseFloat(t.amount.toString());
    });

    console.log(`\nIncome Transactions:`);
    console.log(`- Non-Auto INCOME: ${realIncome}`);
    console.log(`- Auto-Advance INCOME (excluded): ${autoAdvanceDetected}`);

    const calcTotal = totalTableAdvance + realIncome + totalTxRepaid;
    console.log(`\n=> Dashboard Final Calculation: ${calcTotal}`);

    // Cross-check with 14189032
    console.log(`Target: 14189032`);
    console.log(`Difference: ${calcTotal - 14189032}`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
