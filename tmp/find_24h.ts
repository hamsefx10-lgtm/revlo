
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const transactions = await prisma.transaction.findMany({
        where: {
            createdAt: {
                gte: oneDayAgo
            }
        },
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            customer: true
        }
    });
    fs.writeFileSync('tmp/trx_24h.json', JSON.stringify(transactions, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
