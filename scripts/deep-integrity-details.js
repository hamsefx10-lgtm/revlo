
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const cid = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    const laborRecords = await prisma.projectLabor.findMany({
        where: { project: { companyId: cid } },
        include: { employee: true, project: true }
    });

    const allTrx = await prisma.transaction.findMany({
        where: { companyId: cid }
    });

    console.log(`Analyzing ProjectLabor Mismatches for Birshiil:\n`);

    const missingLabor = [];
    for (const l of laborRecords) {
        const amount = parseFloat(l.agreedWage);
        const dateStr = l.dateWorked.toISOString().split('T')[0];

        // Check for a transaction on same date with same amount
        // Matches by description as well if possible
        const match = allTrx.find(t =>
            (Math.abs(parseFloat(t.amount)) === Math.abs(amount)) &&
            (t.transactionDate.toISOString().split('T')[0] === dateStr)
        );

        if (!match) {
            missingLabor.push(l);
        }
    }

    console.log(`Found ${missingLabor.length} labor records without exact transaction matches:`);
    missingLabor.forEach(l => {
        console.log(`- ID: ${l.id}`);
        console.log(`  Project: ${l.project.name}`);
        console.log(`  Employee: ${l.employee.fullName}`);
        console.log(`  Amount: ${l.agreedWage}`);
        console.log(`  Date: ${l.dateWorked.toISOString().split('T')[0]}`);
        console.log(`  Desc: ${l.description}`);
        console.log(`-----------------------------------`);
    });

    // Check for duplicate transactions (Potential double counting)
    console.log(`\nChecking for duplicate TRANSACTIONS (Same date, amount, description):`);
    const duplicates = [];
    const seen = new Set();

    allTrx.forEach(t1 => {
        const key = `${t1.transactionDate.toISOString().split('T')[0]}_${t1.amount}_${t1.description}`;
        if (seen.has(key)) return;

        const count = allTrx.filter(t2 =>
            t2.transactionDate.toISOString().split('T')[0] === t1.transactionDate.toISOString().split('T')[0] &&
            t2.amount.toString() === t1.amount.toString() &&
            t2.description === t1.description
        );

        if (count.length > 1) {
            duplicates.push({ key, count: count.length, ids: count.map(c => c.id) });
        }
        seen.add(key);
    });

    console.log(`Found ${duplicates.length} duplicate transaction groups:`);
    duplicates.slice(0, 5).forEach(d => {
        console.log(`- ${d.key} (Count: ${d.count})`);
        console.log(`  IDs: ${d.ids.join(', ')}`);
    });

}

main().catch(console.error).finally(() => prisma.$disconnect());
