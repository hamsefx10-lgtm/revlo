const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function trace5000() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const transactions = await prisma.transaction.findMany({ where: { companyId } });

    for (const t of transactions) {
        const amt = Math.abs(Number(t.amount));

        // What could cause Ledger to be exactly +5000 over Dashboard?
        // Ledger ignores Dashboard exclusions.

        // Could it be a DEBT_RECEIVED of 5000?
        if (t.type === 'DEBT_RECEIVED') {
            console.log("Found DEBT_RECEIVED:", amt, t);
        }

        // Could it be a missing TRANSFER pair where TRANSFER_IN was recorded but no TRANSFER_OUT?
        // (Or vice-versa)
    }

    // Let's check transfers
    let sumTransIn = 0;
    let sumTransOut = 0;
    transactions.forEach(t => {
        if (t.type === 'TRANSFER_IN') sumTransIn += Math.abs(Number(t.amount));
        if (t.type === 'TRANSFER_OUT') sumTransOut += Math.abs(Number(t.amount));
    });

    console.log("Transfers In:", sumTransIn);
    console.log("Transfers Out:", sumTransOut);
    console.log("Transfer Diff:", Math.abs(sumTransIn - sumTransOut));
}

trace5000().finally(() => prisma.$disconnect());
