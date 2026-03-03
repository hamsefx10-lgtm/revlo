import prisma from '../lib/db';

async function auditPartialExpenses() {
    console.log('--- Baaritaanka Kharashyada Qaybta la bixiyay (Partial Payments) ---\n');

    try {
        const expenses = await prisma.expense.findMany({
            where: {
                paymentStatus: 'PARTIAL'
            },
            include: {
                transactions: true,
                account: true,
                vendor: true,
            }
        });

        console.log(`Waxa la helay ${expenses.length} kharash oo PARTIAL ah.`);

        for (const exp of expenses) {
            console.log(`\n=> Kharash ID: ${exp.id} | ${exp.description} | Total: ${exp.amount}`);
            console.log(`   Transactions Tiradooda: ${exp.transactions.length}`);

            let totalTrxAmount = 0;
            exp.transactions.forEach(t => {
                console.log(`     - [${t.type}] Amount: ${t.amount} | Date: ${t.transactionDate.toISOString().split('T')[0]} | Account: ${t.accountId || 'NONE'}`);
                totalTrxAmount += Math.abs(Number(t.amount));
            });

            console.log(`   Wadarta Transactions: ${totalTrxAmount} vs Total Expense: ${exp.amount}`);
        }

    } catch (error) {
        console.error('Cilad:', error);
    } finally {
        await prisma.$disconnect();
    }
}

auditPartialExpenses();
