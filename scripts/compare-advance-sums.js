
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // Birshiil

    const projectsResult = await prisma.project.aggregate({
        _sum: { advancePaid: true },
        where: { companyId }
    });
    const projectTableSum = Number(projectsResult._sum.advancePaid || 0);

    const transactions = await prisma.transaction.findMany({
        where: {
            companyId,
            type: 'INCOME',
            description: { contains: 'Advance Payment for Project' }
        }
    });
    const transactionSum = transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    console.log(`Total advancePaid in Project table: ${projectTableSum}`);
    console.log(`Total 'Advance Payment...' transactions: ${transactionSum}`);
    console.log(`Difference: ${projectTableSum - transactionSum}`);

    if (projectTableSum !== transactionSum) {
        console.log("\nInvestigation: Discrepancy found!");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
