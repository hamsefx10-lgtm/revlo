
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const targetLaborId = 'a2028ebe-4a55-49b5-9b3e-9a0ef1451116';
    const labor = await prisma.projectLabor.findUnique({
        where: { id: targetLaborId }
    });

    if (labor) {
        console.log(`Labor Record Details (ID: ${targetLaborId}):`);
        console.log(`- Agreed Wage: ${labor.agreedWage}`);
        console.log(`- Paid Amount: ${labor.paidAmount}`);
        console.log(`- Paid From: ${labor.paidFrom}`);
        console.log(`- Description: ${labor.description}`);
    } else {
        console.log("Labor record not found.");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
