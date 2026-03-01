
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const laborRecords = await prisma.projectLabor.findMany({
        where: { project: { companyId: cid } }
    });

    console.log(`Labor Integrity Audit for Birshiil (${cid})\n`);
    console.log(`Total ProjectLabor Records: ${laborRecords.length}`);

    const allTrx = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    // ProjectLabor records typically link to a transaction via description/amount if not explicitly linked.
    // Actually, let's see if ProjectLabor has an explicit transaction link field in schema.
    // Looking back at my view of schema.prisma, ProjectLabor wasn't fully shown.

    // Let's just check for loose matches for these labor records.
    let laborWithTx = 0;
    for (const l of laborRecords) {
        const hasMatch = allTrx.some(t =>
            Math.abs(parseFloat(t.amount)) === Math.abs(parseFloat(l.agreedWage)) &&
            t.transactionDate.toISOString().split('T')[0] === l.dateWorked.toISOString().split('T')[0]
        );
        if (hasMatch) laborWithTx++;
    }

    console.log(`Labor records with potential matching transactions: ${laborWithTx}`);
    console.log(`Labor records WITHOUT matches: ${laborRecords.length - laborWithTx}`);

}

main().catch(console.error).finally(() => prisma.$disconnect());
