const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function auditAdvances() {
    const projects = await prisma.project.findMany({
        include: { transactions: true }
    });

    let totalStrandedAdvance = 0;
    const strandedProjects = [];

    for (const project of projects) {
        const advance = Number(project.advancePaid) || 0;
        if (advance > 0) {

            const sumIncomeTransactions = project.transactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

            // We only care if they are strictly missing the INCOME trace for advance
            if (sumIncomeTransactions < advance) {
                const missingAmount = advance - sumIncomeTransactions;
                totalStrandedAdvance += missingAmount;
                strandedProjects.push({
                    id: project.id,
                    name: project.name,
                    advancePaid: advance,
                    missingAmount,
                    createdAt: project.createdAt
                });
            }
        }
    }

    const accounts = await prisma.account.findMany();
    const summary = {
        totalStrandedAdvance,
        projectCount: strandedProjects.length,
        strandedProjects,
        accounts: accounts.map(a => ({ id: a.id, name: a.name, type: a.type, balance: Number(a.balance) }))
    };

    fs.writeFileSync('audit-advances-result.json', JSON.stringify(summary, null, 2));
    console.log("Done. Check audit-advances-result.json");
}

auditAdvances().finally(() => prisma.$disconnect());
