const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tx29k = await prisma.transaction.findFirst({
        where: { id: '4051e601-dff7-4a47-872f-b4509c2e662f' }
    });

    const isInIncome = (['INCOME', 'TRANSFER_IN'].includes(tx29k.type) || (tx29k.type === 'DEBT_REPAID' && !tx29k.vendorId));
    const isInExpense = (['EXPENSE', 'TRANSFER_OUT', 'DEBT_TAKEN'].includes(tx29k.type) || (tx29k.type === 'DEBT_REPAID' && tx29k.vendorId));

    console.log(`Transaction 29k:`);
    console.log(`- Type: ${tx29k.type}`);
    console.log(`- VendorId: ${tx29k.vendorId}`);
    console.log(`- Is Inflow (Income)? ${isInIncome}`);
    console.log(`- Is Outflow (Expense)? ${isInExpense}`);
}

main().finally(() => prisma.$disconnect());
