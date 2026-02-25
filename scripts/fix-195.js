const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAnomalies() {
    console.log("Starting DB Patch for the 195k Anomaly...");

    const mainCompanyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // Birshiil

    // 1. Fix the 190,000 ETB Cross-Company Leak
    // Find the transaction that went into a Birshiil account but belonged to "birshiil work shop"
    const leakedTxn = await prisma.transaction.findFirst({
        where: {
            amount: 190000,
            type: 'INCOME',
            companyId: 'd22beba9-b3c3-40a5-8375-6ad7d7794265' // "birshiil work shop"
        }
    });

    if (leakedTxn) {
        console.log(`[PATCH 1] Found 190k leaked transaction (${leakedTxn.id}). Re-assigning to main company...`);
        await prisma.transaction.update({
            where: { id: leakedTxn.id },
            data: { companyId: mainCompanyId }
        });
        console.log("   -> ✅ Fixed Cross-Company Leak.");
    } else {
        console.log("[PATCH 1] 190k transaction not found or already fixed.");
    }


    // 2. Fix the 5,000 ETB Bankless Loan
    // Find the DEBT_GIVEN for 5000 that has NO account
    const banklessTxn = await prisma.transaction.findFirst({
        where: {
            amount: 5000,
            type: 'DEBT_GIVEN',
            accountId: null,
            companyId: mainCompanyId
        }
    });

    if (banklessTxn) {
        console.log(`[PATCH 2] Found 5k Bankless Loan (${banklessTxn.id}). Assigning to E-Birr account...`);

        // We need to find the main E-Birr account
        const eBirrAcc = await prisma.account.findFirst({
            where: { name: { contains: 'e-birr', mode: 'insensitive' }, companyId: mainCompanyId }
        });

        if (eBirrAcc) {
            await prisma.transaction.update({
                where: { id: banklessTxn.id },
                data: { accountId: eBirrAcc.id }
            });
            console.log(`   -> ✅ Fixed Bankless Loan. Assigned to Account: ${eBirrAcc.name}`);
        } else {
            console.log("   -> ❌ E-Birr account not found for patching.");
        }
    } else {
        console.log("[PATCH 2] 5k Bankless Loan not found or already fixed.");
    }

    console.log("\nDone patching anomalies.");
}

fixAnomalies()
    .catch(e => {
        console.error("Failed to patch anomalies:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
