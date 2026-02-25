import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';

    // Find CBE account ID
    const cbeAccount = await prisma.account.findFirst({
        where: { name: { contains: 'CBE', mode: 'insensitive' }, companyId }
    });

    if (!cbeAccount) {
        console.error('CBE account not found for this company!');
        return;
    }
    const cbeAccountId = cbeAccount.id;
    console.log(`Using CBE account ID: ${cbeAccountId}`);

    // Find a valid userId
    const user = await prisma.user.findFirst();

    if (!user) {
        console.error('No users found! Cannot restore.');
        return;
    }

    const userId = user.id;
    console.log(`Using userId for restoration: ${userId}`);

    const transactionsToRestore = [
        {
            id: '782bb502-fa34-4162-b878-7e5c0b4ceb9e',
            description: 'day kasoo xarootay',
            amount: 30000,
            type: 'INCOME' as const,
            transactionDate: new Date('2025-12-30T00:00:00.000Z'),
            accountId: cbeAccountId,
            projectId: '35a1ea4e-3e67-40b4-9edc-7411482ba453',
            companyId: companyId,
            userId: userId,
            note: 'Restored after erroneous duplicate deletion'
        },
        {
            id: '959de5f7-7f6c-4f1b-83dc-33df9c9969b4',
            description: 'lacag qabasho saylada yucub',
            amount: 60000,
            type: 'INCOME' as const,
            transactionDate: new Date('2026-01-06T00:00:00.000Z'),
            accountId: cbeAccountId,
            projectId: 'b531edb0-87ad-4054-952a-b2914cfbc8ee',
            companyId: companyId,
            userId: userId,
            note: 'Restored after erroneous duplicate deletion'
        }
    ];

    console.log(`Starting restoration of ${transactionsToRestore.length} transactions...`);

    for (const txData of transactionsToRestore) {
        try {
            const created = await prisma.transaction.create({
                data: txData
            });
            console.log(`Successfully restored transaction: ${created.id} (${created.amount} ETB)`);
        } catch (error: any) {
            console.error(`Failed to restore transaction ${txData.id}: ${error.message}`);
        }
    }

    console.log('\nFinal DB Summary check for these projects:');
    const projects = await prisma.project.findMany({
        where: { id: { in: ['35a1ea4e-3e67-40b4-9edc-7411482ba453', 'b531edb0-87ad-4054-952a-b2914cfbc8ee'] } },
        include: { transactions: { where: { type: 'INCOME' } } }
    });

    projects.forEach(p => {
        const totalIncome = p.transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        console.log(`- Project: ${p.name} | Agreement: ${p.agreementAmount} | Total INCOME Txns: ${totalIncome}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
