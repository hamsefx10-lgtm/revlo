const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectAdvances() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // Get all project table advances
    const projects = await prisma.project.findMany({ where: { companyId } });
    let totalProjectTableAdvance = 0;
    for (const p of projects) {
        totalProjectTableAdvance += Number(p.advancePaid || 0);
    }

    // Get all transaction table auto-advances
    const allTxns = await prisma.transaction.findMany({ where: { companyId } });
    let totalTxnAutoAdvance = 0;
    for (const trx of allTxns) {
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');
        if (trx.type === 'INCOME' && isAutoAdvance) {
            totalTxnAutoAdvance += Math.abs(Number(trx.amount));
        }
    }

    console.log(`Sum of Projects Table 'advancePaid': ${totalProjectTableAdvance}`);
    console.log(`Sum of Transaction Table Auto-Advances: ${totalTxnAutoAdvance}`);
    console.log(`Difference: ${totalTxnAutoAdvance - totalProjectTableAdvance}`);

    // Let's list exactly which projects have mismatched advances
    for (const p of projects) {
        let pTxnSum = 0;
        for (const t of allTxns) {
            const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');
            if (t.projectId === p.id && t.type === 'INCOME' && isAutoAdvance) {
                pTxnSum += Math.abs(Number(t.amount));
            }
        }

        if (Number(p.advancePaid || 0) !== pTxnSum) {
            console.log(`Mismatch on Project ${p.name}: advancePaid column is ${Number(p.advancePaid)}, but INCOMES sum to ${pTxnSum}`);
        }
    }

}
checkProjectAdvances().finally(() => prisma.$disconnect());
