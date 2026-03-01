const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function deepInvestigation() {
    let output = "=== VERIFIED AUDIT: AFTER GLOBAL SUMMARY FIX ===\n";

    // 1. Get Accounts and their Stored Balances
    const accounts = await prisma.account.findMany();
    let totalStoredBalance = 0;
    accounts.forEach(acc => {
        totalStoredBalance += Number(acc.balance);
    });
    output += `TOTAL STORED ACCOUNTS BALANCE: ${totalStoredBalance.toLocaleString()} ETB\n`;

    // 2. Aggregate Transactions
    const allTx = await prisma.transaction.findMany();

    let totalInflow = 0;
    let totalOutflow = 0;

    allTx.forEach(trx => {
        const amount = Math.abs(Number(trx.amount));
        const isAutoAdvance = (trx.description || '').toLowerCase().includes('advance payment for project');

        const isStandardIn = [
            'INCOME', 'TRANSFER_IN', 'SHAREHOLDER_DEPOSIT', 'DEBT_RECEIVED', 'OTHER'
        ].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId) ||
            (trx.type === 'TRANSFER_OUT' && trx.accountId === null);

        const isStandardOut = ['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(trx.type) ||
            (trx.type === 'DEBT_REPAID' && trx.vendorId);

        if (isStandardIn) {
            if (!(trx.type === 'INCOME' && isAutoAdvance)) {
                totalInflow += amount;
            }
        }
        if (isStandardOut) {
            totalOutflow += amount;
        }
    });

    // Add Project Advances
    const allProjects = await prisma.project.findMany();
    const totalProjectAdvances = allProjects.reduce((sum, p) => sum + Number(p.advancePaid), 0);
    totalInflow += totalProjectAdvances;

    const netFlow = totalInflow - totalOutflow;

    output += "\n--- Updated Transaction Summary (Reports View) ---\n";
    output += `Total Inflow (including Proj Adv): ${totalInflow.toLocaleString()} ETB\n`;
    output += `Total Outflow: ${totalOutflow.toLocaleString()} ETB\n`;
    output += `NET FLOW (In - Out): ${netFlow.toLocaleString()} ETB\n`;

    output += "\n--- Analysis ---\n";
    output += `Difference (Balance - Net Flow): ${(totalStoredBalance - netFlow).toLocaleString()} ETB\n`;

    fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\scripts\\final_verification_result.txt', output);
    console.log("Audit complete.");
}

deepInvestigation().catch(console.error).finally(() => prisma.$disconnect());
