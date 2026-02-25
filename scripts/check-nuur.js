const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNuurProject() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const projectId = '2970784b-8a6f-415e-a0cd-a6d3e1177801';

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { transactions: true }
    });

    console.log(`Project: ${project.name}`);
    console.log(`Advance Paid: ${project.advancePaid}`);
    console.log(`\nTransactions:`);

    for (const t of project.transactions) {
        console.log(`- ${t.type} | Amount: ${t.amount} | Date: ${t.transactionDate} | Desc: ${t.description}`);
    }
}
checkNuurProject().finally(() => prisma.$disconnect());
