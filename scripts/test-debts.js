const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
    const company = await prisma.company.findFirst();
    if (!company) return console.log('No company');

    const txs = await prisma.transaction.findMany({
        where: {
            companyId: company.id,
            OR: [{ type: 'DEBT_TAKEN' }, { type: 'DEBT_REPAID' }]
        },
        include: { vendor: true, customer: true, project: true }
    });

    const expenses = await prisma.expense.findMany({
        where: {
            companyId: company.id,
            OR: [
                { category: 'Debt' },
                { category: 'Debt Repayment' },
                { description: { contains: 'debt', mode: 'insensitive' } },
                { description: { contains: 'loan', mode: 'insensitive' } },
                { description: { contains: 'deyn', mode: 'insensitive' } }
            ]
        },
        include: { vendor: true, customer: true, project: true }
    });

    fs.writeFileSync('test-debts-output.json', JSON.stringify({ txs, expenses }, null, 2));
}
main().finally(() => prisma.$disconnect());
