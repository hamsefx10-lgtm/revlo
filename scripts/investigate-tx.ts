import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const searchTerm = process.argv[2] || 'Ahmed';
    const amountSearch = process.argv[3] ? Number(process.argv[3]) : null;

    console.log(`Searching for: "${searchTerm}"` + (amountSearch ? ` with amount: ${amountSearch}` : ''));

    const transactions = await prisma.transaction.findMany({
        where: {
            OR: [
                { description: { contains: searchTerm } },
                { note: { contains: searchTerm } },
                { customer: { name: { contains: searchTerm } } },
                { vendor: { name: { contains: searchTerm } } },
                { project: { name: { contains: searchTerm } } }
            ],
            ...(amountSearch ? { amount: amountSearch } : {})
        },
        include: {
            customer: true,
            vendor: true,
            project: true,
            account: true
        },
        orderBy: { transactionDate: 'desc' }
    });

    console.log(`Found ${transactions.length} transactions:`);
    transactions.forEach(t => {
        console.log(`- [${t.transactionDate.toISOString().split('T')[0]}] ${t.type} | ID: ${t.id} | Amount: ${t.amount} | Entity: ${t.customer?.name || t.vendor?.name || 'N/A'} | Project: ${t.project?.name || 'N/A'} | Desc: ${t.description}`);
    });

    // Also search projects directly
    const projects = await prisma.project.findMany({
        where: {
            OR: [
                { name: { contains: searchTerm } },
                { customer: { name: { contains: searchTerm } } }
            ]
        },
        include: {
            customer: true,
            transactions: true
        }
    });

    console.log(`\nFound ${projects.length} projects:`);
    projects.forEach(p => {
        console.log(`- Project: ${p.name} | ID: ${p.id} | Customer: ${p.customer?.name} | Balance: ${p.agreementAmount} | Advance: ${p.advancePaid}`);
        p.transactions.forEach(t => {
            console.log(`  - Tx: ${t.type} | ${t.amount} | ${t.description}`);
        });
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
