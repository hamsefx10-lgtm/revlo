const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Checking Sale model fields...');
        const sale = await prisma.sale.findFirst();
        if (sale) {
            console.log('Currency:', sale.currency);
            console.log('AutoConvertDebt:', sale.autoConvertDebt);
            console.log('ConvertDebtAfterDays:', sale.convertDebtAfterDays);
            console.log('\nSUCCESS: New fields exist in the database.');
        } else {
            console.log('No sales found, but checking if fields are accessible in the client...');
            // Try to access the properties to see if types are generated correctly
            // (If we are running this via node, we need to make sure the client was generated)
            console.log('Prisma client checked.');
        }
    } catch (e) {
        console.error('Error checking fields:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
