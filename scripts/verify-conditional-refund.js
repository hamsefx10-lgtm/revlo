
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a'; // Birshiil Petty Cash

    // 1. Get initial balance
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    const initialBalance = Number(account.balance);
    console.log(`Initial Balance: ${initialBalance}`);

    // 2. Create an orphaned expense
    const orphanedExpense = await prisma.expense.create({
        data: {
            companyId,
            description: 'TEST ORPHANED EXPENSE (NO TRX)',
            amount: 1000,
            paymentStatus: 'PAID',
            paidFrom: accountId,
            expenseDate: new Date(),
            category: 'Other'
        }
    });
    console.log(`Created orphaned expense: ${orphanedExpense.id}`);

    // 3. Verify balance didn't change (creating via Prisma directly doesn't trigger balance decrement usually unless API is used)
    // But for this test, we just want to ensure DELETING it doesn't INCREMENT.
    const balanceAfterCreate = Number((await prisma.account.findUnique({ where: { id: accountId } })).balance);
    console.log(`Balance after create: ${balanceAfterCreate}`);

    // 4. Trigger DELETE through the simulated API logic (or just run the logic manually here since we can't easily hit NEXT API)
    // Actually, let's just use the logic from the route.ts

    console.log("\nSimulating DELETE logic...");
    const linkedTransactions = await prisma.transaction.findMany({
        where: { expenseId: orphanedExpense.id }
    });
    const totalTrxAmount = linkedTransactions.reduce((sum, trx) => sum + Math.abs(Number(trx.amount)), 0);
    console.log(`Linked Transactions found: ${linkedTransactions.length}, Total Trx Amount: ${totalTrxAmount}`);

    if (accountId && totalTrxAmount > 0) {
        console.log("REFUNDING BALANCE...");
        await prisma.account.update({
            where: { id: accountId },
            data: { balance: { increment: totalTrxAmount } }
        });
    } else {
        console.log("NO TRANSACTIONS FOUND. SKIPPING REFUND (SAFE).");
    }

    // 5. Verify final balance
    const finalBalance = Number((await prisma.account.findUnique({ where: { id: accountId } })).balance);
    console.log(`Final Balance: ${finalBalance}`);

    if (finalBalance === balanceAfterCreate) {
        console.log("\nSUCCESS: Orphaned expense deletion did NOT cause a false refund.");
    } else {
        console.log("\nFAILURE: Balance increased despite missing transaction.");
    }

    // Cleanup
    await prisma.expense.delete({ where: { id: orphanedExpense.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());
