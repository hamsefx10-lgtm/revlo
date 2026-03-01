const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function countTypes() {
    const counts = await prisma.transaction.groupBy({
        by: ['type', 'accountId'],
        _count: { id: true }
    });
    let output = "Transaction Counts by Type and accountId status:\n";
    counts.forEach(c => {
        output += `Type: ${c.type}, accountId: ${c.accountId ? 'STATED' : 'NULL'}, Count: ${c._count.id}\n`;
    });
    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\type_counts.txt', output);
    console.log("Counts complete.");
}

countTypes().catch(console.error).finally(() => prisma.$disconnect());
