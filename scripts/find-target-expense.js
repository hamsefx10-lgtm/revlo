
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const expense = await prisma.expense.findMany({
        where: {
            OR: [
                { amount: 49999 },
                { amount: 50000 },
                { description: { contains: 'almuniamka' } }
            ]
        }
    });

    console.log(`Found ${expense.length} matching expense records:`);
    expense.forEach(e => {
        console.log(`- ID: ${e.id}, Amount: ${e.amount}, Desc: ${e.description}, Status: ${e.paymentStatus}, PaidFrom: ${e.paidFrom}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
