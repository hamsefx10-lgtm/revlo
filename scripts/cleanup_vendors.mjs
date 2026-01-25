
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('Starting cleanup...');

    try {
        const vendors = await prisma.shopVendor.findMany({ select: { id: true } });
        const validIds = new Set(vendors.map(v => v.id));
        console.log(`Found ${validIds.size} valid vendors.`);

        const expenses = await prisma.expense.findMany({
            where: { vendorId: { not: null } },
            select: { id: true, vendorId: true }
        });

        const invalidIds = expenses
            .filter(e => !validIds.has(e.vendorId))
            .map(e => e.id);

        console.log(`Found ${invalidIds.length} expenses with invalid vendor IDs.`);

        if (invalidIds.length > 0) {
            const result = await prisma.expense.updateMany({
                where: { id: { in: invalidIds } },
                data: { vendorId: null }
            });
            console.log(`Successfully updated ${result.count} expenses.`);
        } else {
            console.log('No invalid expenses found.');
        }

        // Clean Transactions
        console.log('Checking transactions...');
        const transactions = await prisma.transaction.findMany({
            where: { vendorId: { not: null } },
            select: { id: true, vendorId: true }
        });

        const invalidtransIds = transactions
            .filter(t => !validIds.has(t.vendorId))
            .map(t => t.id);

        console.log(`Found ${invalidtransIds.length} transactions with invalid vendor IDs.`);

        if (invalidtransIds.length > 0) {
            const result = await prisma.transaction.updateMany({
                where: { id: { in: invalidtransIds } },
                data: { vendorId: null }
            });
            console.log(`Successfully updated ${result.count} transactions.`);
        } else {
            console.log('No invalid transactions found.');
        }
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
