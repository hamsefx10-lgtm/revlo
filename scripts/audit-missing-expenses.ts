import prisma from '../lib/db';

async function auditExpenses() {
    console.log('--- Baaritaanka Kharashyada aan ku jirin Transactions (Invisible Expenses) ---\n');

    try {
        // Hel dhammaan expenses-ka
        const expenses = await prisma.expense.findMany({
            include: {
                transactions: true,
                account: true,
                vendor: true,
                project: true
            }
        });

        let missingCount = 0;

        for (const exp of expenses) {
            if (exp.transactions.length === 0) {
                missingCount++;
                console.log(`[KHATAR] Kharash ID: ${exp.id} MA LAHA WAAYO TRANSACTIONS!`);
                console.log(`  - Sharaxaad: ${exp.description}`);
                console.log(`  - Qiimaha: $${exp.amount}`);
                console.log(`  - Taariikh: ${exp.expenseDate.toISOString()}`);
                console.log(`  - Category: ${exp.category}`);
                console.log(`  - Account ID: ${exp.paidFrom || exp.accountId || 'Lama garanayo'}`);
                if (exp.vendor) console.log(`  - Vendor: ${exp.vendor.name}`);
                console.log('----------------------------------------------------');
            }
        }

        console.log(`\nNatiijada: ${missingCount} kharash ayaa la helay oo aan lahayn wax Transaction ah.`);

    } catch (error) {
        console.error('Cilad ayaa dhacday:', error);
    } finally {
        await prisma.$disconnect();
    }
}

auditExpenses();
