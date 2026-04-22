const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const u = await prisma.user.findUnique({where: {id: '6789dbe7-1d48-4775-a722-2f7fa8cbae38'}});
    const c = await prisma.company.findUnique({where: {id: '6789dbe7-1d48-4775-a722-2f7fa8cbae38'}});
    console.log('User:', u?.email, 'Company:', c?.name);
}
main().finally(() => prisma.$disconnect());
