const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function findGhostTxs() {
    const txs = await prisma.transaction.findMany({
        where: { accountId: null },
        include: { company: true }
    });

    const ghosts = txs.filter(t => !(t.fromAccountId || t.toAccountId));

    let output = "GHOST TRANSACTIONS (No Account, No Transfer)\n";
    ghosts.forEach(g => {
        output += `ID: ${g.id}\nCompany: ${g.company ? g.company.name : 'Unknown'}\nType: ${g.type}\nAmount: ${g.amount}\nDate: ${g.transactionDate}\nDesc: ${g.description}\n-------------------\n`;
    });

    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\ghost_report.txt', output);
    console.log("Found " + ghosts.length + " true ghosts.");
}

findGhostTxs().catch(console.error).finally(() => prisma.$disconnect());
