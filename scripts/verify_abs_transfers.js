const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // Find all internal transfers
    const outTransfers = await prisma.transaction.findMany({
        where: { companyId, type: 'TRANSFER_OUT' },
        include: { account: true, toAccount: true }
    });

    console.log('--- TRANSFER_OUT (CBE -> E-Birr) ---');
    let totalOut = 0;
    outTransfers.forEach(t => {
        console.log(`Date: ${t.transactionDate.toISOString().split('T')[0]}, Amount: ${t.amount}, From: ${t.account?.name}, To: ${t.toAccount?.name}`);
        totalOut += Math.abs(Number(t.amount));
    });

    console.log('\nTotal Absolute TRANSFER_OUT:', totalOut);

    // Sum of "Income" in CBE (DB) + Absolute value of TRANSFER_OUT (CBE)
    const dbCBEIncome = 6109000; // From previous script
    console.log('\nCBE DB Income + Absolute Transfer Out:', dbCBEIncome + totalOut);
    console.log('User Reported CBE Income:', 6269798);
}

main().catch(console.error).finally(() => prisma.$disconnect());
