const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVendorRepayments() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const allTxns = await prisma.transaction.findMany({
        where: { companyId, type: 'DEBT_REPAID', vendorId: { not: null } }
    });

    let vendorRepaySum = 0;
    for (const t of allTxns) {
        vendorRepaySum += Math.abs(Number(t.amount));
    }
    console.log('Total Vendor Repayments going OUT:', vendorRepaySum);
}

checkVendorRepayments().finally(() => prisma.$disconnect());
