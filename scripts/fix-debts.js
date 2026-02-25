const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDebts() {
    const allTxns = await prisma.transaction.findMany();

    const debtsTaken = allTxns.filter(t => typeof t.type === 'string' && t.type === 'DEBT_TAKEN');

    let vendorCount = 0;
    let customerEmployeeCount = 0;
    let expenseCount = 0;

    console.log(`Found ${debtsTaken.length} DEBT_TAKEN transactions to migrate...`);

    for (const t of debtsTaken) {
        let newType = 'DEBT_TAKEN';

        if (t.vendorId) {
            newType = 'EXPENSE';
            vendorCount++;
        } else if (t.customerId || t.employeeId) {
            newType = 'DEBT_GIVEN';
            customerEmployeeCount++;
        } else {
            // No vendor, no customer, no employee. Mostly "Material expense" or direct transfers.
            const desc = (t.description || '').toLowerCase();
            if (desc.includes('expense') || desc.includes('kharash') || desc.includes('material')) {
                newType = 'EXPENSE';
                expenseCount++;
            } else {
                // Assume someone was given money (e.g. "nuur loo diray")
                newType = 'DEBT_GIVEN';
                customerEmployeeCount++;
            }
        }

        if (newType !== 'DEBT_TAKEN') {
            try {
                await prisma.transaction.update({
                    where: { id: t.id },
                    data: { type: newType }
                });
                console.log(`✓ Updated [${t.transactionDate.toISOString().split('T')[0]}] ${t.description} -> ${newType}`);
            } catch (err) {
                // Fallback or ignore if the enum refuses the string, though Prisma usually accepts it at the JS level 
                // if the old schema allows it, or if it isn't strictly typed.
                console.error(`X Failed to update [${t.description}]:`, err.message);
            }
        }
    }

    console.log(`\n--- MIGRATION COMPLETE ---`);
    console.log(`Migrated to EXPENSE (Vendor): ${vendorCount}`);
    console.log(`Migrated to EXPENSE (General): ${expenseCount}`);
    console.log(`Migrated to DEBT_GIVEN (Customer/Employee): ${customerEmployeeCount}`);
}

fixDebts().catch(e => console.error(e)).finally(() => prisma.$disconnect());
