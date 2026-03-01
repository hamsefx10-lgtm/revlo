const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function find() {
    const companies = await prisma.company.findMany({
        where: {
            name: { contains: 'Birshiil', mode: 'insensitive' }
        }
    });
    console.log(JSON.stringify(companies, null, 2));
}

find().catch(console.error).finally(() => prisma.$disconnect());
