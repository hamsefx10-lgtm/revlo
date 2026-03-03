import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function checkAccount() {
    const accounts = await prisma.account.findMany({
        where: { name: { contains: 'CBE' } }
    });

    const data = accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        balance: acc.balance.toString(),
        companyId: acc.companyId
    }));

    fs.writeFileSync('cbe_list.json', JSON.stringify(data, null, 2));
}

checkAccount()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
