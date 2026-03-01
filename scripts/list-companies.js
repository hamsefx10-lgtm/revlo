const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const companies = await prisma.company.findMany();
    console.log('Companies:', JSON.stringify(companies, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
