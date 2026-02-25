import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Auditing all DEBT_REPAID transactions...");

    const txs = await prisma.transaction.findMany({
        where: { type: 'DEBT_REPAID' },
        include: {
            project: true,
            customer: true,
            vendor: true,
            account: true
        }
    });

    console.log(`Total DEBT_REPAID found: ${txs.length}`);

    const vendorRepayments = txs.filter(t => t.vendorId !== null);
    const customerRepayments = txs.filter(t => t.customerId !== null || (t.vendorId === null && t.projectId !== null));
    const ambiguousRepayments = txs.filter(t => t.vendorId === null && t.customerId === null && t.projectId === null);

    console.log(`\n--- Vendor Repayments (Expenses) [${vendorRepayments.length}] ---`);
    vendorRepayments.forEach(t => {
        console.log(`- Amt: ${t.amount} | Entity: ${t.vendor?.name} | Desc: ${t.description}`);
    });

    console.log(`\n--- Customer/Project Repayments (Income) [${customerRepayments.length}] ---`);
    customerRepayments.forEach(t => {
        console.log(`- Amt: ${t.amount} | Entity: ${t.customer?.name || 'Proj: ' + t.project?.name} | Desc: ${t.description}`);
    });

    console.log(`\n--- Ambiguous Repayments (Neither Vendor nor Customer) [${ambiguousRepayments.length}] ---`);
    ambiguousRepayments.forEach(t => {
        console.log(`- ID: ${t.id} | Amt: ${t.amount} | Desc: ${t.description} | Date: ${t.transactionDate.toISOString().split('T')[0]}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
