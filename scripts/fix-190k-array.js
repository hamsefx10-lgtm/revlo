const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function patch190k() {
    const mainCompanyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const badTxns = [
        "4c9e0b3d-3881-4629-88e1-f7ace95cee26",
        "9baba587-abe6-4d79-ac4b-c1802e5f89ae",
        "2e7d7d78-eb5f-46a7-9e0a-452f78085723",
        "f4075b27-f5df-4b5c-8aef-29875bb03cd2"
    ];

    for (const id of badTxns) {
        await prisma.transaction.update({
            where: { id },
            data: { companyId: mainCompanyId }
        });
        console.log(`Successfully migrated leaked transaction ${id} back to main company.`);
    }

    // Also verify the 5k bankless loan was fixed previously
    console.log("Finished patching the 4 leaked transactions.");
}

patch190k().finally(() => prisma.$disconnect());
