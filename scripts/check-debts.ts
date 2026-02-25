import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDebts() {
    const debtsTaken = await prisma.transaction.findMany({
        where: { type: 'DEBT_TAKEN' },
        include: {
            vendor: true,
            customer: true,
            project: true,
            employee: true
        }
    });

    let total = 0;
    console.log('--- DEBT TAKEN TRANSACTIONS ---');
    for (const t of debtsTaken) {
        const amount = Number(t.amount);
        total += Math.abs(amount);
        console.log(`[${t.transactionDate.toISOString().split('T')[0]}] ${t.description} | Amount: ${amount} | Vendor: ${t.vendor?.name || 'N/A'} | Customer: ${t.customer?.name || 'N/A'} | Project: ${t.project?.name || 'N/A'} | Employee: ${t.employee?.fullName || 'N/A'}`);
    }
    console.log(`\nTotal DEBT_TAKEN: ${total}`);

    const debtsGiven = await prisma.transaction.findMany({
        where: { type: 'DEBT_GIVEN' },
        include: { vendor: true, customer: true, project: true, employee: true }
    });

    let totalGiven = 0;
    console.log('\n--- DEBT GIVEN TRANSACTIONS ---');
    for (const t of debtsGiven) {
        const amount = Number(t.amount);
        totalGiven += Math.abs(amount);
        console.log(`[${t.transactionDate.toISOString().split('T')[0]}] ${t.description} | Amount: ${amount} | Vendor: ${t.vendor?.name || 'N/A'} | Customer: ${t.customer?.name || 'N/A'} | Project: ${t.project?.name || 'N/A'} | Employee: ${t.employee?.fullName || 'N/A'}`);
    }
    console.log(`\nTotal DEBT_GIVEN: ${totalGiven}`);

    await prisma.$disconnect();
}

checkDebts().catch(e => console.error(e));
