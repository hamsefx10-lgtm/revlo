
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companies = await prisma.company.findMany();

    const results = [];
    for (const company of companies) {
        const cid = company.id;

        const projectsAdvance = await prisma.project.aggregate({
            _sum: { advancePaid: true },
            where: { companyId: cid }
        });

        const transactions = await prisma.transaction.findMany({
            where: { companyId: cid }
        });

        let incomeTotal = 0;
        let debtRepaidedTotal = 0;
        transactions.forEach(trx => {
            const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');
            if (trx.type === 'INCOME' && !isAutoAdvance) {
                incomeTotal += parseFloat(trx.amount.toString());
            } else if (trx.type === 'DEBT_REPAID' && !trx.vendorId) {
                debtRepaidedTotal += parseFloat(trx.amount.toString());
            }
        });

        const totalIncome = (parseFloat(projectsAdvance._sum.advancePaid || 0)) + incomeTotal + debtRepaidedTotal;

        if (totalIncome > 1000000) {
            results.push({
                id: cid,
                name: company.name,
                totalIncome
            });
        }
    }

    console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
