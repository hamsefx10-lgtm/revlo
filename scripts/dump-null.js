const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function dump() {
    const txs = await prisma.transaction.findMany({
        where: { accountId: null }
    });
    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\null_tx_dump.json', JSON.stringify(txs, null, 2));
    console.log("Done.");
}

dump().catch(console.error).finally(() => prisma.$disconnect());
