
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const company = await prisma.company.findUnique({ where: { id: cid } });

    console.log(`Auditing Transactions for Birshiil: ${company.name} (${cid})\n`);

    // 1. Find transactions missing ALL account links
    const orphanedTransactions = await prisma.transaction.findMany({
        where: {
            companyId: cid,
            accountId: null,
            fromAccountId: null,
            toAccountId: null
        }
    });

    console.log(`Transactions with NO Account links: ${orphanedTransactions.length}`);
    orphanedTransactions.forEach(t => {
        console.log(`- ID: ${t.id}, Type: ${t.type}, Amount: ${t.amount}, Desc: ${t.description}`);
    });

    // 2. Count all transactions by type and check linkage
    const allTrx = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    const summary = {};
    allTrx.forEach(t => {
        const isLinked = !!(t.accountId || t.fromAccountId || t.toAccountId);
        if (!summary[t.type]) summary[t.type] = { total: 0, linked: 0, unlinked: 0 };
        summary[t.type].total++;
        if (isLinked) summary[t.type].linked++;
        else summary[t.type].unlinked++;
    });

    console.log(`\nTransaction Linkage Summary:`);
    console.table(summary);

    // 3. Project Payments (Payment model)
    const payments = await prisma.payment.findMany({
        where: {
            project: { companyId: cid }
        },
        include: { project: true }
    });

    console.log(`\nChecking Project Payments (Payment model):`);
    console.log(`Total Payments found in Payment table: ${payments.length}`);

    let paymentsWithoutTx = 0;
    for (const p of payments) {
        const matchingTx = allTrx.find(t =>
            t.type === 'DEBT_REPAID' &&
            Math.abs(parseFloat(t.amount)) === Math.abs(parseFloat(p.amount)) &&
            new Date(t.transactionDate).toDateString() === new Date(p.paymentDate).toDateString()
        );
        if (!matchingTx) {
            paymentsWithoutTx++;
            // console.log(`- Potential Missing Transaction for Payment: $${p.amount} on ${p.paymentDate.toDateString()}`);
        }
    }
    console.log(`Payments without clear matching DEBT_REPAID transaction: ${paymentsWithoutTx}`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
