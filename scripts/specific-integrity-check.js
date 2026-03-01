
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    console.log(`Deep Investigation for Birshiil:\n`);

    // 1. Duplicate Transaction Analysis (ID check)
    const allTrx = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    const duplicates = [];
    const seen = new Set();

    allTrx.forEach(t1 => {
        const key = `${t1.transactionDate.toISOString().split('T')[0]}_${t1.amount.toString()}_${t1.description}`;
        if (seen.has(key)) return;

        const group = allTrx.filter(t2 =>
            t2.transactionDate.toISOString().split('T')[0] === t1.transactionDate.toISOString().split('T')[0] &&
            t2.amount.toString() === t1.amount.toString() &&
            t2.description === t1.description
        );

        if (group.length > 1) {
            duplicates.push({ key, ids: group.map(g => g.id), type: group[0].type });
        }
        seen.add(key);
    });

    console.log(`Duplicate Transactions Found: ${duplicates.length}`);
    if (duplicates.length > 0) {
        console.log(`Example: ${duplicates[0].key}`);
        console.log(`IDs in this group: ${duplicates[0].ids.join(', ')}`);
        console.log(`Result: IDS ARE UNIQUE/DIFFERENT.\n`);
    }

    // 2. 50k Labor Re-entry Check
    const targetLaborId = 'a2028ebe-4a55-49b5-9b3e-9a0ef1451116'; // ID from previous audit
    const labor = await prisma.projectLabor.findUnique({
        where: { id: targetLaborId },
        include: { project: true, employee: true }
    });

    console.log(`Checking Labor Record: 50,000 ETB (ID: ${targetLaborId})`);
    const amount = 50000;
    const dateStr = '2025-07-30';

    // Search for ANY transaction with this amount and date, regardless of ID link
    const possibleTxMatch = allTrx.filter(t =>
        Math.abs(parseFloat(t.amount)) === amount &&
        t.transactionDate.toISOString().split('T')[0] === dateStr
    );

    console.log(`Transactions found with amount 50,000 on 2025-07-30: ${possibleTxMatch.length}`);
    possibleTxMatch.forEach(t => {
        console.log(`- Trx ID: ${t.id}, Type: ${t.type}, Desc: ${t.description}, LinkedToLaborId: ${t.expenseId}`);
    });

    // Search for OTHER labor records with same amount/date in same project
    const sameProjectLabor = await prisma.projectLabor.findMany({
        where: {
            projectId: labor.projectId,
            agreedWage: amount,
            dateWorked: {
                gte: new Date('2025-07-30T00:00:00Z'),
                lte: new Date('2025-07-30T23:59:59Z')
            }
        }
    });

    console.log(`\nOther ProjectLabor records for same worker/project on same day: ${sameProjectLabor.length}`);
    sameProjectLabor.forEach(l => {
        console.log(`- Labor ID: ${l.id}, Desc: ${l.description}`);
    });

}

main().catch(console.error).finally(() => prisma.$disconnect());
