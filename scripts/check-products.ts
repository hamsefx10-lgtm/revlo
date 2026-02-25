import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Users and Companies...");
    const users = await prisma.user.findMany({
        select: { id: true, email: true, companyId: true, company: { select: { name: true } } }
    });
    console.log(JSON.stringify(users, null, 2));

    console.log("\nChecking Product table...");

    const totalProducts = await prisma.product.count();
    console.log(`Total Products in DB: ${totalProducts}`);

    const products = await prisma.product.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { email: true, companyId: true } }
        }
    });

    console.log("\n20 Most Recent Products:");
    products.forEach(p => {
        console.log(`- ID: ${p.id} | Name: ${p.name} | SKU: ${p.sku} | Stock: ${p.stock} | User: ${p.user?.email} (${p.userId})`);
    });

    // Check for products with empty user (shouldn't happen with the schema but let's check correctly)
    const allProducts = await prisma.product.findMany({
        select: { userId: true }
    });
    const uniqueUsers = new Set(allProducts.map(p => p.userId));
    console.log(`\nUnique Users in Product Table: ${Array.from(uniqueUsers).join(', ')}`);

    console.log("\nChecking InventoryItem table...");
    const totalInventoryItems = await prisma.inventoryItem.count();
    console.log(`Total InventoryItems in DB: ${totalInventoryItems}`);

    if (totalInventoryItems > 0) {
        const inventoryItems = await prisma.inventoryItem.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
        console.log("Recent InventoryItems:");
        console.log(JSON.stringify(inventoryItems, null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
