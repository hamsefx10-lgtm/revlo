
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({ select: { companyId: true }, take: 1 });
    if (users.length === 0) { console.log('No users'); return; }
    const companyId = users[0].companyId;

    console.log('CompanyID:', companyId);

    const accounts = await prisma.account.findMany({
        where: { companyId },
        select: { id: true, name: true, type: true, balance: true }
    });

    console.log('Accounts:', JSON.stringify(accounts, null, 2));

    const distinctTypes = await prisma.account.findMany({
        where: { companyId },
        distinct: ['type'],
        select: { type: true }
    });
    console.log('Distinct Types:', distinctTypes);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
