const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditIncome() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // 1. Get all projects
    const projects = await prisma.project.findMany({ where: { companyId } });

    // 2. Get all transactions counted as Income by dashboard
    const allTxns = await prisma.transaction.findMany({
        where: { companyId, type: { in: ['INCOME', 'DEBT_REPAID'] } },
        include: { project: true }
    });

    let projectAdvanceTotal = 0;
    let manualProjectIncome = 0;
    let manualGenericIncome = 0;
    let manualDebtRepaid = 0;
    let manualProjectDebtRepaid = 0;

    let duplicatesDetect = [];

    for (const p of projects) {
        projectAdvanceTotal += Number(p.advancePaid || 0);

        // Find matching transactions for this project
        const pTxns = allTxns.filter(t => t.projectId === p.id);

        let sumManualIncome = 0;
        let sumDebtRepaid = 0;

        for (const t of pTxns) {
            const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');
            const amt = Math.abs(Number(t.amount));

            if (t.type === 'INCOME' && !isAutoAdvance) {
                sumManualIncome += amt;
                manualProjectIncome += amt;
                duplicatesDetect.push({
                    id: t.id,
                    projectId: p.id,
                    projectName: p.name,
                    desc: t.description,
                    amount: amt,
                    type: 'INCOME (Manual)'
                });
            } else if (t.type === 'DEBT_REPAID' && !t.vendorId) {
                sumDebtRepaid += amt;
                manualProjectDebtRepaid += amt;
            }
        }
    }

    for (const t of allTxns) {
        if (!t.projectId) {
            const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');
            const amt = Math.abs(Number(t.amount));

            if (t.type === 'INCOME' && !isAutoAdvance) {
                manualGenericIncome += amt;
            } else if (t.type === 'DEBT_REPAID' && !t.vendorId) {
                manualDebtRepaid += amt;
            }
        }
    }

    console.log('--- DASHBOARD INCOME BREAKDOWN ---');
    console.log(`1. Project Advances (Table Sum): ${projectAdvanceTotal.toLocaleString()}`);
    console.log(`2. Manual Generic Income (No Project): ${manualGenericIncome.toLocaleString()}`);
    console.log(`3. Manual Project Income (Potential Duplicates!): ${manualProjectIncome.toLocaleString()}`);
    console.log(`4. Debt Repayments (No Project): ${manualDebtRepaid.toLocaleString()}`);
    console.log(`5. Project Debt Repayments (Customer Payments): ${manualProjectDebtRepaid.toLocaleString()}`);

    const totalCalculated = projectAdvanceTotal + manualGenericIncome + manualProjectIncome + manualDebtRepaid + Math.abs(manualProjectDebtRepaid);
    console.log(`\nTOTAL CALCULATED VIRTUAL INCOME: ${totalCalculated.toLocaleString()}`);

    if (duplicatesDetect.length > 0) {
        console.log('\n--- POTENTIAL DUPLICATES FOUND IN PROJECT RECORDS ---');
        console.log(duplicatesDetect);
    } else {
        console.log('\nNo obvious duplicate generic Income records found for Projects.');
    }

}

auditIncome().finally(() => prisma.$disconnect());
