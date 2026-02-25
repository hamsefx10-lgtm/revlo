const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function deepAuditIncome() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // Get all projects
    const projects = await prisma.project.findMany({
        where: { companyId },
        include: { customer: true }
    });

    // Get all transactions
    const allTxns = await prisma.transaction.findMany({
        where: { companyId },
        include: { project: true, customer: true }
    });

    const report = {
        projectAdvances: [],
        nonProjectIncomes: [],
        debtRepaidIncomes: [],
        suspiciousMatches: [],
        potential100kSources: []
    };

    let totalProjectAdvance = 0;
    for (const p of projects) {
        const adv = Number(p.advancePaid || 0);
        totalProjectAdvance += adv;
        report.projectAdvances.push({
            id: p.id,
            name: p.name,
            advancePaid: adv,
            createdAt: p.createdAt
        });
    }

    for (const t of allTxns) {
        const amt = Math.abs(Number(t.amount));
        const desc = (t.description || '').toLowerCase();
        const isAutoAdvance = desc.includes('advance payment for project');

        // Check for standalone 100k transactions
        if (amt === 100000 && t.type === 'INCOME') {
            report.potential100kSources.push({
                id: t.id,
                desc: t.description,
                amount: amt,
                type: t.type,
                projectId: t.projectId
            });
        }

        // Check non-project incomes
        if (t.type === 'INCOME' && !isAutoAdvance && !t.projectId) {
            report.nonProjectIncomes.push({
                id: t.id,
                desc: t.description,
                amount: amt,
                date: t.transactionDate
            });
        }

        // Check debt repaid (excluding vendors)
        if (t.type === 'DEBT_REPAID' && !t.vendorId) {
            report.debtRepaidIncomes.push({
                id: t.id,
                desc: t.description,
                amount: amt,
                date: t.transactionDate,
                projectId: t.projectId
            });

            if (amt === 100000) {
                report.potential100kSources.push({
                    id: t.id,
                    desc: t.description,
                    amount: amt,
                    type: t.type,
                    projectId: t.projectId
                });
            }
        }

        // Check if there's any manual income linked to a project (we deleted 2 earlier, are there more?)
        if (t.type === 'INCOME' && !isAutoAdvance && t.projectId) {
            report.suspiciousMatches.push({
                reason: 'Manual INCOME on a Project (Potential Duplicate)',
                id: t.id,
                projectName: t.project.name,
                desc: t.description,
                amount: amt
            });
        }
    }

    // Look for sums that equal exactly 100,000 in non-project incomes or debt repaid
    // (Simple check for now, let's just dump all non-project incomes to review)

    fs.writeFileSync('deep-income-audit.json', JSON.stringify(report, null, 2));
    console.log("Deep audit written to deep-income-audit.json");
}

deepAuditIncome().finally(() => prisma.$disconnect());
