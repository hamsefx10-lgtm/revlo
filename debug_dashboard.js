const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const company = await prisma.company.findFirst();
        if (!company) {
            console.log('No company found');
            return;
        }
        const companyId = company.id;
        console.log('Testing aggregation for company:', companyId);

        console.log('4. Testing Sale Item GroupBy (Simplified)...');
        try {
            const topProducts = await prisma.saleItem.groupBy({
                by: ['productId', 'productName'],
                where: { sale: { companyId } },
                _sum: { quantity: true, total: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5
            });
            console.log('   Result:', topProducts);
        } catch (e) {
            console.log('   FAILED WITH RELATION FILTER. Trying flat filter...');
            const topProducts = await prisma.saleItem.groupBy({
                by: ['productId', 'productName'],
                _sum: { quantity: true, total: true },
                orderBy: { _sum: { quantity: 'desc' } },
                take: 5
            });
            console.log('   Result (Flat):', topProducts);
        }

    } catch (error) {
        console.error('ERROR:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
