const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function findNullAccountTx() {
    const txs = await prisma.transaction.findMany({
        where: { accountId: null }
    });
    let output = "Transactions with accountId: NULL\n";
    txs.forEach(t => {
        output += `ID: ${t.id}, Type: ${t.type}, Amount: ${t.amount}, Desc: ${t.description}, from: ${t.fromAccountId}, to: ${t.toAccountId}\n`;
    });
    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\null_tx.txt', output);
    console.log("Found " + txs.length + " transactions.");
}

findNullAccountTx().catch(console.error).finally(() => prisma.$disconnect());
