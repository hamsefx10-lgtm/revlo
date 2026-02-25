const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function checkProjectAgreementsJSON() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const projectsWithDebtRepaid = await prisma.project.findMany({
        where: {
            companyId,
            transactions: { some: { type: 'DEBT_REPAID' } }
        },
        include: { transactions: true }
    });

    const reps = [];
    for (const p of projectsWithDebtRepaid) {
        let debtRepaidSum = 0;
        for (const t of p.transactions) {
            if (t.type === 'DEBT_REPAID') {
                debtRepaidSum += Math.abs(Number(t.amount));
            }
        }

        reps.push({
            projectName: p.name,
            agreementAmount: Number(p.agreementAmount),
            advancePaid: Number(p.advancePaid || 0),
            debtRepaidSum: debtRepaidSum,
            isExactMatch: Number(p.advancePaid || 0) === debtRepaidSum
        });
    }

    fs.writeFileSync('agreements-results.json', JSON.stringify(reps, null, 2));
}

checkProjectAgreementsJSON().finally(() => prisma.$disconnect());
