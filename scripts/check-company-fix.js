const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function checkCompany() {
    const companies = await prisma.company.findMany();
    let results = {};

    for (const c of companies) {
        const accounts = await prisma.account.findMany({ where: { companyId: c.id } });
        let totalBalance = 0;
        accounts.forEach(a => totalBalance += Number(a.balance));

        const transactions = await prisma.transaction.findMany({ where: { companyId: c.id } });
        let totalIncome = 0;
        let totalExpense = 0;
        let totalAssets = 0;

        transactions.forEach(t => {
            const amt = Math.abs(Number(t.amount));
            const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');

            if (t.type === 'INCOME' && !isAutoAdvance) {
                totalIncome += amt;
            } else if (t.type === 'DEBT_REPAID' && !t.vendorId) {
                totalIncome += amt;
            }

            if (t.type === 'EXPENSE' || t.type === 'DEBT_TAKEN' || t.type === 'DEBT_GIVEN' || (t.type === 'DEBT_REPAID' && t.vendorId)) {
                if (t.category !== 'FIXED_ASSET_PURCHASE') {
                    totalExpense += amt;
                } else {
                    totalAssets += amt;
                }
            }
        });

        const projects = await prisma.project.findMany({ where: { companyId: c.id } });
        projects.forEach(p => {
            totalIncome += Number(p.advancePaid);
        });

        results[c.id] = {
            name: c.name,
            totalBalance,
            dashboardIncome: totalIncome,
            dashboardExpense: totalExpense,
            dashboardAssets: totalAssets,
            dashboardExpected: totalIncome - totalExpense - totalAssets,
            discrepancy: totalBalance - (totalIncome - totalExpense - totalAssets)
        };
    }

    fs.writeFileSync('check-company-result.json', JSON.stringify(results, null, 2));
}

checkCompany().finally(() => prisma.$disconnect());
