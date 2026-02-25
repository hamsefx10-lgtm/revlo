import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const searchTerm = 'Ahmed';
    console.log(`Deep auditing for: "${searchTerm}"`);

    const customers = await prisma.customer.findMany({
        where: { name: { contains: searchTerm } },
        include: {
            transactions: {
                include: { project: true }
            },
            projects: {
                include: { transactions: true }
            }
        }
    });

    console.log(`Found ${customers.length} customers matching "${searchTerm}"`);

    for (const c of customers) {
        console.log(`\nCUSTOMER: ${c.name} (ID: ${c.id})`);
        console.log(`Transactions (${c.transactions.length}):`);
        c.transactions.forEach(t => {
            console.log(`- [${t.transactionDate.toISOString().split('T')[0]}] ${t.type} | Amt: ${t.amount} | Project: ${t.project?.name || 'N/A'} | Desc: ${t.description}`);
        });

        console.log(`Projects (${c.projects.length}):`);
        for (const p of c.projects) {
            console.log(`- PROJECT: ${p.name} (ID: ${p.id}) | Agreement: ${p.agreementAmount} | Advance: ${p.advancePaid}`);
            const pTxs = p.transactions;
            console.log(`  Project-linked Transactions (${pTxs.length}):`);
            pTxs.forEach(t => {
                console.log(`  - [${t.transactionDate.toISOString().split('T')[0]}] ${t.type} | Amt: ${t.amount} | Desc: ${t.description}`);
            });
        }
    }

    // Search transactions directly without customer link but with "Ahmed" in desc
    const directTxs = await prisma.transaction.findMany({
        where: {
            description: { contains: searchTerm },
            customerId: null // Only those not already linked to a customer record
        },
        include: { project: true }
    });

    if (directTxs.length > 0) {
        console.log(`\nDirect Transactions (desc contains "Ahmed", no customer link):`);
        directTxs.forEach(t => {
            console.log(`- [${t.transactionDate.toISOString().split('T')[0]}] ${t.type} | Amt: ${t.amount} | Project: ${t.project?.name || 'N/A'} | Desc: ${t.description}`);
        });
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
