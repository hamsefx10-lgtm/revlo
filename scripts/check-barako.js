const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBarako() {
    const vendor = await prisma.shopVendor.findFirst({
        where: { name: { contains: 'Barako' } }
    });

    if (!vendor) {
        console.log("No Barako vendor found");
        return;
    }

    const txns = await prisma.transaction.findMany({
        where: { vendorId: vendor.id }
    });

    const exps = await prisma.expense.findMany({
        where: { vendorId: vendor.id }
    });

    console.log("Transactions:", txns);
    console.log("Expenses:", exps);
}

checkBarako().finally(() => prisma.$disconnect());
