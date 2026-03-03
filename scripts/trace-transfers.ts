import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function traceTransfers() {
    const id = 'c8306c05-5279-4b05-b5fc-dda41c793a77';

    const transfersOut = await prisma.transaction.findMany({
        where: { fromAccountId: id }
    });

    const transfersIn = await prisma.transaction.findMany({
        where: { toAccountId: id }
    });

    let totalOut = 0;
    transfersOut.forEach(t => {
        totalOut += typeof t.amount.toNumber === 'function' ? t.amount.toNumber() : Number(t.amount);
    });

    let totalIn = 0;
    transfersIn.forEach(t => {
        totalIn += typeof t.amount.toNumber === 'function' ? t.amount.toNumber() : Number(t.amount);
    });

    const output = {
        totalOut,
        totalIn,
        netImpact: totalIn - totalOut
    };

    fs.writeFileSync('transfers_summary.json', JSON.stringify(output, null, 2));
}

traceTransfers().catch(console.error).finally(() => prisma.$disconnect());
