
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const transactions = await prisma.transaction.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 20,
        include: {
            customer: true,
            vendor: true
        }
    });
    fs.writeFileSync('tmp/trx_with_entities.json', JSON.stringify(transactions, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
