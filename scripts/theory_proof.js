const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
    const transactions = await prisma.transaction.findMany({
        where: { companyId },
        include: { account: true }
    });

    const summaryDB = { CBE: 0, Ebirr: 0 };
    const summaryAbs = { CBE: 0, Ebirr: 0 };

    transactions.forEach(t => {
        const amount = Number(t.amount);
        const absAmount = Math.abs(amount);
        const name = (t.account?.name || '').toLowerCase();

        let isCBE = name.includes('cbe');
        let isEbirr = name.includes('ebirr') || name.includes('e-birr');

        // 1. Correct Inflow Logic
        const isInflow = [
            'INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'DEBT_TAKEN'
        ].includes(t.type) || (t.type === 'DEBT_REPAID' && !t.vendorId);

        if (isInflow) {
            if (isCBE) summaryDB.CBE += amount;
            if (isEbirr) summaryDB.Ebirr += amount;
        }

        // 2. "Absolute" Logic (Suspected User Method)
        // Summing everything that is either an INCOME-like type OR just everything positive-ish
        if (isInflow || t.type === 'TRANSFER_OUT') {
            if (isCBE) summaryAbs.CBE += absAmount;
            if (isEbirr) summaryAbs.Ebirr += absAmount;
        }
    });

    console.log('--- DB Correct Totals (Inflows Only) ---');
    console.log('CBE:', summaryDB.CBE);
    console.log('E-Birr:', summaryDB.Ebirr);
    console.log('Total:', summaryDB.CBE + summaryDB.Ebirr);

    console.log('\n--- Theory: User Summing Transfers as Positive ---');
    console.log('CBE (Income + Abs Transfer):', summaryAbs.CBE);
    console.log('E-Birr (Income + Abs Transfer):', summaryAbs.Ebirr);
    console.log('Total:', summaryAbs.CBE + summaryAbs.Ebirr);

    console.log('\n--- User Reported ---');
    console.log('CBE:', 6269798);
    console.log('E-Birr:', 8469628.41);
    console.log('Total:', 14739426);
}

main().finally(() => prisma.$disconnect());
