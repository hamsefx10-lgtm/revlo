import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function repairLaborData() {
    console.log('--- Starting Labor Data Repair ---');

    // 1. Find CompanyLabor records with 0 paidAmount but where we might have a corresponding Expense
    const zeroCompanyLabors = await prisma.companyLabor.findMany({
        where: { paidAmount: 0 },
        include: { employee: true }
    });

    console.log(`Found ${zeroCompanyLabors.length} CompanyLabor records with 0 paidAmount.`);

    for (const labor of zeroCompanyLabors) {
        // Look for an Expense record created around the same time for this employee with category 'Company Labor'
        const matchingExpense = await prisma.expense.findFirst({
            where: {
                employeeId: labor.employeeId,
                category: 'Company Labor',
                expenseDate: labor.dateWorked,
                amount: { not: '0' }
            }
        });

        if (matchingExpense) {
            console.log(`  Repairing CompanyLabor ${labor.id}: Setting paidAmount to ${matchingExpense.amount} from Expense ${matchingExpense.id}`);
            const newPaid = Number(matchingExpense.amount);
            await prisma.companyLabor.update({
                where: { id: labor.id },
                data: {
                    paidAmount: newPaid,
                    remainingWage: (Number(labor.agreedWage) || 0) - newPaid
                }
            });
        }
    }

    // 2. Find any Labor payments (ProjectLabor) that lack a corresponding Expense
    const projectLabors = await prisma.projectLabor.findMany({
        include: { project: true, employee: true }
    });

    console.log(`Auditing ${projectLabors.length} ProjectLabor records for missing Expenses...`);

    for (const labor of projectLabors) {
        // Check if an expense exists for this labor payment
        // Since we didn't have a direct relation before, we check by employeeId, projectId, and date
        // AND amount.
        const hasExpense = await prisma.expense.findFirst({
            where: {
                employeeId: labor.employeeId,
                projectId: labor.projectId,
                category: 'Labor',
                expenseDate: labor.dateWorked,
                amount: labor.paidAmount?.toString()
            }
        });

        if (!hasExpense && Number(labor.paidAmount) > 0) {
            console.log(`  MISSING EXPENSE for ProjectLabor ${labor.id}. Creating one...`);
            // Create the missing expense
            // We need a userId, let's find the first user in the company
            const company = await prisma.company.findUnique({
                where: { id: labor.project.companyId },
                include: { users: { take: 1 } }
            });

            if (company && company.users.length > 0) {
                const userId = company.users[0].id;
                const newExp = await prisma.expense.create({
                    data: {
                        description: labor.description || `Labor payment to ${labor.employee.fullName}`,
                        amount: labor.paidAmount!.toString(),
                        category: 'Labor',
                        paidFrom: labor.paidFrom || 'Cash',
                        expenseDate: labor.dateWorked,
                        companyId: labor.project.companyId,
                        userId: userId,
                        projectId: labor.projectId,
                        employeeId: labor.employeeId,
                        approved: true
                    }
                });
                console.log(`    Created Expense ${newExp.id}`);

                // Also check if a Transaction exists
                const hasTx = await prisma.transaction.findFirst({
                    where: {
                        expenseId: newExp.id,
                        type: 'EXPENSE'
                    }
                });

                if (!hasTx) {
                    await prisma.transaction.create({
                        data: {
                            description: newExp.description,
                            amount: -Math.abs(Number(labor.paidAmount)),
                            type: 'EXPENSE',
                            transactionDate: labor.dateWorked,
                            accountId: labor.paidFrom,
                            expenseId: newExp.id,
                            employeeId: labor.employeeId,
                            userId: userId,
                            companyId: labor.project.companyId,
                            projectId: labor.projectId
                        }
                    });
                    console.log(`    Created Transaction for Expense ${newExp.id}`);
                }
            }
        }
    }

    // 3. Same for CompanyLabor
    const companyLabors = await prisma.companyLabor.findMany({
        include: { employee: true }
    });

    console.log(`Auditing ${companyLabors.length} CompanyLabor records for missing Expenses...`);

    for (const labor of companyLabors) {
        const hasExpense = await prisma.expense.findFirst({
            where: {
                employeeId: labor.employeeId,
                projectId: null,
                category: 'Company Labor',
                expenseDate: labor.dateWorked,
                amount: labor.paidAmount?.toString()
            }
        });

        if (!hasExpense && Number(labor.paidAmount) > 0) {
            console.log(`  MISSING EXPENSE for CompanyLabor ${labor.id}. Creating one...`);
            const company = await prisma.company.findUnique({
                where: { id: labor.companyId },
                include: { users: { take: 1 } }
            });

            if (company && company.users.length > 0) {
                const userId = company.users[0].id;
                const newExp = await prisma.expense.create({
                    data: {
                        description: labor.description || `Company Labor payment to ${labor.employee.fullName}`,
                        amount: labor.paidAmount!.toString(),
                        category: 'Company Labor',
                        paidFrom: labor.paidFrom || 'Cash',
                        expenseDate: labor.dateWorked,
                        companyId: labor.companyId,
                        userId: userId,
                        employeeId: labor.employeeId,
                        approved: true
                    }
                });
                console.log(`    Created Expense ${newExp.id}`);

                // Transaction check
                const hasTx = await prisma.transaction.findFirst({
                    where: {
                        expenseId: newExp.id,
                        type: 'EXPENSE'
                    }
                });

                if (!hasTx) {
                    await prisma.transaction.create({
                        data: {
                            description: newExp.description,
                            amount: -Math.abs(Number(labor.paidAmount)),
                            type: 'EXPENSE',
                            transactionDate: labor.dateWorked,
                            accountId: labor.paidFrom,
                            expenseId: newExp.id,
                            employeeId: labor.employeeId,
                            userId: userId,
                            companyId: labor.companyId
                        }
                    });
                    console.log(`    Created Transaction for Expense ${newExp.id}`);
                }
            }
        }
    }

    console.log('--- Labor Data Repair Complete ---');
}

repairLaborData()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
