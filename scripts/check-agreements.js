const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProjectAgreements() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const projectsWithDebtRepaid = await prisma.project.findMany({
        where: {
            companyId,
            transactions: { some: { type: 'DEBT_REPAID' } }
        },
        include: { transactions: true }
    });

    console.log(`Analyzing ${projectsWithDebtRepaid.length} projects with DEBT_REPAID...`);

    for (const p of projectsWithDebtRepaid) {
        let debtRepaidSum = 0;
        for (const t of p.transactions) {
            if (t.type === 'DEBT_REPAID') {
                debtRepaidSum += Math.abs(Number(t.amount));
            }
        }

        console.log(`\n--- Project: ${p.name} ---`);
        console.log(`Agreement Amount: ${Number(p.agreementAmount)}`);
        console.log(`Advance Paid Column: ${Number(p.advancePaid || 0)}`);
        console.log(`Sum of DEBT_REPAID: ${debtRepaidSum}`);
        console.log(`Does Advance Paid == Sum of Debt Repaid? ${Number(p.advancePaid || 0) === debtRepaidSum}`);
    }
}

checkProjectAgreements().finally(() => prisma.$disconnect());
