const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = '081fb675-b41e-4cea-92f7-50a55eb3e6f1'; // Birshiil (14M screenshot)

async function detailedAudit() {
    console.log("=== DETAILED AUDIT FOR BIRSHIIL (14M) ===");

    // 1. Account Balances
    const accounts = await prisma.account.findMany({ where: { companyId: COMPANY_ID } });
    const totalAccountBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
    console.log(`TOTAL STORED ACCOUNT BALANCE: ${totalAccountBalance.toLocaleString()} ETB`);

    // 2. Project Advances
    const projects = await prisma.project.findMany({ where: { companyId: COMPANY_ID } });
    const totalAdvances = projects.reduce((s, p) => s + Number(p.advancePaid), 0);
    console.log(`TOTAL PROJECT ADVANCES: ${totalAdvances.toLocaleString()} ETB`);

    // 3. Transactions
    const txs = await prisma.transaction.findMany({ where: { companyId: COMPANY_ID } });

    let inflow = totalAdvances;
    let outflow = 0;

    // Logic from reports/route.ts
    txs.forEach(t => {
        const amount = Math.abs(Number(t.amount));
        const isAutoAdv = (t.description || '').toLowerCase().includes('advance payment for project');

        const isUnifiedTransfer = t.accountId === null && (t.fromAccountId || t.toAccountId);
        const isGhost = t.accountId === null && !isUnifiedTransfer;

        if (isGhost) return;

        // INFLOW
        const isInflowType = ['INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'OTHER'].includes(t.type) ||
            (t.type === 'DEBT_REPAID' && !t.vendorId) ||
            (t.type === 'TRANSFER_OUT' && t.accountId === null);

        if (isInflowType && !(t.type === 'INCOME' && isAutoAdv)) {
            inflow += amount;
        }

        // OUTFLOW
        const isOutflowType = ['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(t.type) ||
            (t.type === 'DEBT_REPAID' && t.vendorId);

        if (isOutflowType) {
            outflow += amount;
        }
    });

    console.log("\n--- CALCULATION RESULTS ---");
    console.log(`Calculated Inflow:  ${inflow}`);
    console.log(`Calculated Outflow: ${outflow}`);
    console.log(`Calculated Net:     ${inflow - outflow}`);

    console.log("\n--- SCREENSHOT COMPARISON ---");
    console.log(`Screenshot Inflow:  14447830.21`);
    console.log(`Screenshot Outflow: 14411552.06`);
    console.log(`Screenshot Net:     36278.15`);

    process.exit(0);
}

detailedAudit().catch(console.error).finally(() => prisma.$disconnect());
