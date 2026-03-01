
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const transactions = await prisma.transaction.findMany({
        where: {
            createdAt: {
                gte: oneHourAgo
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
    fs.writeFileSync('tmp/trx_last_hour.json', JSON.stringify(transactions, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
