import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    console.log(`Getting accounts for Company ID: ${companyId}`);

    const accs = await prisma.account.findMany({
        where: { companyId }
    });

    console.log('ACCOUNTS FOUND:');
    accs.forEach(acc => {
        console.log(`- ${acc.name} | ID: ${acc.id}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
