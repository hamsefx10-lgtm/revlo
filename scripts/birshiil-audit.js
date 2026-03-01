const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMPANY_ID = 'd22beba9-b3c3-40a5-8375-6ad7d7794265'; // Birshiil workshop

async function detailedAudit() {
    console.log("=== DETAILED AUDIT FOR BIRSHIIL WORKSHOP ===");

    // 1. Account Balances
    const accounts = await prisma.account.findMany({ where: { companyId: COMPANY_ID } });
    const totalAccountBalance = accounts.reduce((s, a) => s + Number(a.balance), 0);
    console.log(`TOTAL STORED ACCOUNT BALANCE: ${totalAccountBalance.toLocaleString()} ETB`);

    // 2. Project Advances (These count as Inflow)
    const projects = await prisma.project.findMany({ where: { companyId: COMPANY_ID } });
    const totalAdvances = projects.reduce((s, p) => s + Number(p.advancePaid), 0);
    console.log(`TOTAL PROJECT ADVANCES: ${totalAdvances.toLocaleString()} ETB`);

    // 3. Transactions
    const txs = await prisma.transaction.findMany({ where: { companyId: COMPANY_ID } });

    let inflow = totalAdvances;
    let outflow = 0;
    let ghostTotal = 0;

    txs.forEach(t => {
        const amount = Math.abs(Number(t.amount));
        const isAutoAdv = (t.description || '').toLowerCase().includes('advance payment for project');

        // Unified Transfer Check
        const isUnifiedTransfer = t.accountId === null && (t.fromAccountId || t.toAccountId);
        const isGhost = t.accountId === null && !isUnifiedTransfer;

        if (isGhost) {
            ghostTotal += (t.type === 'INCOME' ? amount : -amount);
            return; // Skip ghost in liquidity summary
        }

        // INFLOW
        const isInflowType = ['INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'OTHER'].includes(t.type) ||
            (t.type === 'DEBT_REPAID' && !t.vendorId) ||
            (t.type === 'TRANSFER_OUT' && t.accountId === null); // Unified transfer counts as both

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
    console.log(`Calculated Inflow:  ${inflow.toLocaleString()} ETB`);
    console.log(`Calculated Outflow: ${outflow.toLocaleString()} ETB`);
    console.log(`Calculated Net:     ${(inflow - outflow).toLocaleString()} ETB`);

    console.log("\n--- COMPARISON WITH SCREENSHOT ---");
    console.log(`Screenshot Inflow:  14,447,830.21`);
    console.log(`Screenshot Outflow: 14,411,552.06`);
    console.log(`Screenshot Net:     36,278.15`);

    console.log("\n--- UN-ACCOUNTED DATA (GHOSTS) ---");
    const ghostTxs = txs.filter(t => t.accountId === null && !(t.fromAccountId || t.toAccountId));
    console.log(`Found ${ghostTxs.length} ghost transactions.`);
    ghostTxs.forEach(gt => {
        console.log(` - ID: ${gt.id}, Type: ${gt.type}, Amount: ${gt.amount}, Desc: ${gt.description}`);
    });

    process.exit(0);
}

detailedAudit().catch(console.error).finally(() => prisma.$disconnect());
