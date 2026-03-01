
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // Birshiil

    console.log("--- Detailed Info on Missing Inflows ---");

    const missingTypes = ['DEBT_RECEIVED'];
    const transactions = await prisma.transaction.findMany({
        where: {
            companyId,
            OR: [
                { type: { in: missingTypes } },
                { amount: { lt: 0 }, type: 'DEBT_REPAID' } // To find that -29k one
            ]
        },
        include: {
            customer: true,
            vendor: true,
            project: true
        }
    });

    transactions.forEach(t => {
        console.log(`\nID: ${t.id}`);
        console.log(`Type: ${t.type}`);
        console.log(`Amt: ${t.amount}`);
        console.log(`Desc: ${t.description}`);
        console.log(`Customer: ${t.customer?.name || 'N/A'}`);
        console.log(`Vendor: ${t.vendor?.name || 'N/A'}`);
        console.log(`Project: ${t.project?.name || 'N/A'}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
