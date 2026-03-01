
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { amount: -15000 },
                { amount: 15000 }
            ]
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    fs.writeFileSync('tmp/trx_15000_all.json', JSON.stringify(transactions, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
