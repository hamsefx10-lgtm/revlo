import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Product companyId migration...");

    // Get all products that miss companyId
    const products = await prisma.product.findMany({
        where: { companyId: null },
        select: { id: true, userId: true }
    });

    console.log(`Found ${products.length} products to migrate.`);

    for (const product of products) {
        // Find user's company
        const user = await prisma.user.findUnique({
            where: { id: product.userId },
            select: { companyId: true }
        });

        if (user?.companyId) {
            await prisma.product.update({
                where: { id: product.id },
                data: { companyId: user.companyId }
            });
            console.log(`Updated product ${product.id} with company ${user.companyId}`);
        } else {
            console.log(`Skipping product ${product.id}: User ${product.userId} has no company.`);
        }
    }

    console.log("Migration finished.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
