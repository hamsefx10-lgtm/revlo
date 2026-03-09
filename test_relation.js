const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const company = await prisma.company.findFirst();
        const companyId = company.id;
        console.log('Testing groupBy with relation filter...');
        const topProducts = await prisma.saleItem.groupBy({
            by: ['productId', 'productName'],
            where: { sale: { companyId } },
            _sum: { quantity: true, total: true },
        });
        console.log('SUCCESS');
    } catch (e) {
        console.error('FAILED:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
