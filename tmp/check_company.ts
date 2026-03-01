
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const company = await prisma.company.findUnique({
        where: { id: '081fb675-b41e-4cea-92f7-50a5eb3e6f1e' }
    });
    console.log(company?.name);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
