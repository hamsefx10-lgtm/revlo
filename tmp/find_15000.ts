
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const transactions = await prisma.transaction.findMany({
        where: {
            amount: 15000
        }
    });
    console.log(JSON.stringify(transactions, null, 2));
    fs.writeFileSync('tmp/all_15k.json', JSON.stringify(transactions, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
