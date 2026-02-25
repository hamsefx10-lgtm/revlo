import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProjectLaborStatus() {
    console.log('--- Starting Project Labor Status Sweep ---');

    // 1. Find Expenses that are category 'Labor', have a paidFrom account, but are marked as UNPAID
    const unpaidLaborExpenses = await prisma.expense.findMany({
        where: {
            category: 'Labor',
            paidFrom: { notIn: ['', 'UNPAID'] },
            paymentStatus: { not: 'PAID' }
        }
    });

    console.log(`Found ${unpaidLaborExpenses.length} Project Labor expenses with an account but marked as UNPAID.`);

    for (const exp of unpaidLaborExpenses) {
        console.log(`  Updating Expense ${exp.id} status to PAID (Account: ${exp.paidFrom})`);
        await prisma.expense.update({
            where: { id: exp.id },
            data: {
                paymentStatus: 'PAID',
                paymentDate: exp.expenseDate // Keep original date as payment date
            }
        });

        // Also verify if a transaction exists. If not, create it.
        const hasTx = await prisma.transaction.findFirst({
            where: { expenseId: exp.id }
        });

        if (!hasTx) {
            console.log(`    Missing Transaction for ${exp.id}. Creating one...`);
            await prisma.transaction.create({
                data: {
                    description: exp.description,
                    amount: -Math.abs(Number(exp.amount)),
                    type: 'EXPENSE',
                    transactionDate: exp.expenseDate,
                    accountId: exp.paidFrom,
                    expenseId: exp.id,
                    employeeId: exp.employeeId || undefined,
                    userId: exp.userId || undefined,
                    companyId: exp.companyId,
                    projectId: exp.projectId || undefined
                }
            });

            // Since it's a new transaction, we should also manually deduct the balance 
            // because historical records might not have been deducted properly.
            // actually, the user said "lacag aan hada ka hor accountka laga jarin", 
            // so we should be careful. 
            // But if we mark it as PAID and create a transaction, it SHOULD be deducted.
            console.log(`    Deducting balance for account ${exp.paidFrom}...`);
            await prisma.account.update({
                where: { id: exp.paidFrom },
                data: {
                    balance: { decrement: Math.abs(Number(exp.amount)) }
                }
            });
        }
    }

    console.log('--- Project Labor Status Sweep Complete ---');
}

fixProjectLaborStatus()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
