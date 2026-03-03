import prisma from '../lib/db';

async function auditSpecificExpense() {
    console.log('--- Baaritaanka Kharashka Mashruuca ee 73k ---\n');

    try {
        const expenses = await prisma.expense.findMany({
            where: {
                amount: {
                    equals: '73000'
                }
            },
            include: {
                transactions: true,
                account: true,
                vendor: true,
            }
        });

        console.log(`Waxa la helay ${expenses.length} kharash oo 73k ah.`);

        for (const exp of expenses) {
            console.log(`\n=> Kharash ID: ${exp.id} | ${exp.description} | Total Amount: ${exp.amount}`);
            console.log(`   Payment Status: ${exp.paymentStatus} | Category: ${exp.category}`);
            console.log(`   Transactions (Tirada: ${exp.transactions.length}):`);

            let totalTrxAmount = 0;
            exp.transactions.forEach(t => {
                console.log(`     - ID: ${t.id}`);
                console.log(`       Nooca (Type): ${t.type}`);
                console.log(`       Lacagta (Amount): ${t.amount}`);
                console.log(`       Taariikh: ${t.transactionDate.toISOString().split('T')[0]}`);
                console.log(`       Account ID: ${t.accountId || 'VIRTUAL - Ma lahan akoon'}`);
                totalTrxAmount += Math.abs(Number(t.amount));
                console.log('       ---');
            });
        }

    } catch (error) {
        console.error('Cilad:', error);
    } finally {
        await prisma.$disconnect();
    }
}

auditSpecificExpense();
