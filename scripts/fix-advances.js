const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The E-Birr account ID derived from the audit
const EBIRR_ACCOUNT_ID = "3c156507-ea0a-4974-8a54-92f1e9dd519a";

async function fixAdvances() {
    console.log("Starting Historical Project Advance Migration...\n");

    const projects = await prisma.project.findMany({
        include: { transactions: true }
    });

    let totalRecovered = 0;
    let fixedCount = 0;

    for (const project of projects) {
        const advance = Number(project.advancePaid) || 0;
        if (advance > 0) {

            const sumIncomeTransactions = project.transactions
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

            if (sumIncomeTransactions < advance) {
                const missingAmount = advance - sumIncomeTransactions;

                console.log(`Fixing Project: '${project.name}' - Missing: ${missingAmount} ETB`);

                // 1. Create the missing INCOME transaction
                await prisma.transaction.create({
                    data: {
                        description: `Advance Payment for Project: ${project.name}`,
                        amount: missingAmount,
                        type: 'INCOME',
                        transactionDate: project.startDate || project.createdAt,
                        companyId: project.companyId,
                        accountId: EBIRR_ACCOUNT_ID,
                        projectId: project.id,
                        customerId: project.customerId,
                        note: 'SYSTEM RECOVERY: Advance payment automatically generated to fix stranded account balances.',
                    },
                });

                // 2. Adjust the account balance by incrementing it
                await prisma.account.update({
                    where: { id: EBIRR_ACCOUNT_ID },
                    data: { balance: { increment: missingAmount } },
                });

                totalRecovered += missingAmount;
                fixedCount++;
            }
        }
    }

    console.log(`\nMigration Complete!`);
    console.log(`Successfully recovered ${totalRecovered.toLocaleString()} ETB across ${fixedCount} projects.`);
    console.log(`The funds have been deposited directly into the E-Birr account to clear the negative balance.`);
}

fixAdvances()
    .catch(e => {
        console.error("Migration Failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
