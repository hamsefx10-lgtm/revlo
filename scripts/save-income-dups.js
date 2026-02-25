const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function auditIncome() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const projects = await prisma.project.findMany({ where: { companyId } });

    const allTxns = await prisma.transaction.findMany({
        where: { companyId, type: { in: ['INCOME', 'DEBT_REPAID'] } },
        include: { project: true }
    });

    let duplicatesDetect = [];

    for (const p of projects) {
        const pTxns = allTxns.filter(t => t.projectId === p.id);
        for (const t of pTxns) {
            const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');
            const amt = Math.abs(Number(t.amount));

            if (t.type === 'INCOME' && !isAutoAdvance) {
                duplicatesDetect.push({
                    id: t.id,
                    projectId: p.id,
                    projectName: p.name,
                    desc: t.description,
                    amount: amt,
                    type: 'INCOME (Manual)'
                });
            }
        }
    }

    fs.writeFileSync('income-duplicates.json', JSON.stringify(duplicatesDetect, null, 2));
}

auditIncome().finally(() => prisma.$disconnect());
