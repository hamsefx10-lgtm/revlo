
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { description: { contains: 'macmil' } },
                { note: { contains: 'macmil' } },
                { description: { contains: 'customer' } },
                { note: { contains: 'customer' } }
            ]
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: 50
    });
    fs.writeFileSync('tmp/trx_macmil.json', JSON.stringify(transactions, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
