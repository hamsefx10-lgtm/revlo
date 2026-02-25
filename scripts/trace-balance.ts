import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const accountName = 'E-Birr'; // Target the problematic account

    const eBirrAccounts = await prisma.account.findMany({
        where: { name: accountName }
    });

    console.log(`Found ${eBirrAccounts.length} accounts named ${accountName}`);

    for (const account of eBirrAccounts) {
        console.log(`\n========================================`);
        console.log(`Analyzing Account: ${account.name} (ID: ${account.id}, Company: ${account.companyId})`);
        console.log(`Current DB Balance: ${account.balance}`);
        console.log(`========================================`);

        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { accountId: account.id },
                    { fromAccountId: account.id },
                    { toAccountId: account.id }
                ]
            },
            orderBy: [
                { transactionDate: 'asc' },
                { createdAt: 'asc' }
            ],
            include: {
                expense: { select: { description: true, amount: true } },
                project: { select: { name: true } },
            }
        });

        let runningBalance = 0;
        let totalIncome = 0;
        let totalExpense = 0;

        console.log(`Date | Type | Amount | Running Balance | Details`);
        console.log(`--------------------------------------------------`);

        for (const tx of transactions) {
            const amount = Number(tx.amount);
            let action = '';

            if (tx.accountId === account.id) {
                if (['INCOME', 'DEBT_REPAID', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT'].includes(tx.type)) {
                    runningBalance += amount;
                    totalIncome += amount;
                    action = `+${amount}`;
                } else if (['EXPENSE', 'DEBT_TAKEN', 'TRANSFER_OUT', 'SHAREHOLDER_WITHDRAWAL', 'PURCHASE'].includes(tx.type)) {
                    runningBalance -= Math.abs(amount);
                    totalExpense += Math.abs(amount);
                    action = `-${Math.abs(amount)}`;
                } else {
                    runningBalance -= Math.abs(amount); // Default to subtracting
                    totalExpense += Math.abs(amount);
                    action = `-${Math.abs(amount)} (Fallback)`;
                }
            } else if (tx.fromAccountId === account.id && tx.type === 'TRANSFER_OUT') {
                runningBalance -= Math.abs(amount);
                totalExpense += Math.abs(amount);
                action = `-${Math.abs(amount)} (Transfer Out)`;
            } else if (tx.toAccountId === account.id && tx.type === 'TRANSFER_IN') {
                runningBalance += Math.abs(amount);
                totalIncome += Math.abs(amount);
                action = `+${Math.abs(amount)} (Transfer In)`;
            }

            // Highlight negative jumps
            const isNegativeJump = runningBalance < 0 && (runningBalance + Math.abs(amount) >= 0);
            const marker = isNegativeJump ? "⚠️ DIPPED NEGATIVE" : "";

            const details = tx.description || (tx.expense ? tx.expense.description : 'No details');
            console.log(`${tx.transactionDate.toISOString().split('T')[0]} | ${tx.type.padEnd(12)} | ${action.padEnd(10)} | ${runningBalance} | ${details.substring(0, 30)} ${marker}`);
        }

        console.log(`\nFinal Math for Account ${account.id}:`);
        console.log(`Total In: ${totalIncome}`);
        console.log(`Total Out: ${totalExpense}`);
        console.log(`Expected Balance: ${totalIncome - totalExpense}`);
        console.log(`DB Balance: ${account.balance}`);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
