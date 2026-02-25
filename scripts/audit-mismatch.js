const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function auditBalanceMismatch() {
    console.log("Fetching all accounts...");
    const accounts = await prisma.account.findMany();
    let totalAccountBalance = 0;
    accounts.forEach(a => totalAccountBalance += Number(a.balance));

    console.log("Fetching all transactions...");
    const transactions = await prisma.transaction.findMany();

    let income = 0;
    let expenses = 0;
    let fixedAssets = 0;
    let debtTaken = 0; // Historically money OUT?
    let debtReceived = 0;
    let debtGiven = 0;
    let debtRepaid = 0;
    let transferIn = 0;
    let transferOut = 0;
    let unknown = 0;

    // Let's also track the net change per account based strictly on transactions
    const accountCalculatedBalances = {};
    accounts.forEach(a => accountCalculatedBalances[a.id] = { name: a.name, actual: Number(a.balance), calculated: 0, initial: 0 });

    for (const t of transactions) {
        const amount = Number(t.amount);

        // Global aggregates (based on the dashboard logic)
        if (t.type === 'INCOME') {
            const isAutoAdvance = (t.description || '').toLowerCase().includes('advance payment for project');
            // The dashboard logic uses project.advancePaid for sum, but let's just sum all INCOME for true flow
            income += amount;
        } else if (t.type === 'EXPENSE') {
            if (t.category === 'FIXED_ASSET_PURCHASE') {
                fixedAssets += amount;
            } else {
                expenses += amount;
            }
        } else if (t.type === 'DEBT_TAKEN') {
            debtTaken += amount;
        } else if (t.type === 'DEBT_RECEIVED') {
            debtReceived += amount;
        } else if (t.type === 'DEBT_GIVEN') {
            debtGiven += amount;
        } else if (t.type === 'DEBT_REPAID') {
            debtRepaid += amount;
        } else if (t.type === 'TRANSFER_IN') {
            transferIn += amount;
        } else if (t.type === 'TRANSFER_OUT') {
            transferOut += amount;
        } else {
            unknown += amount;
        }

        // Account specific changes
        if (t.accountId && accountCalculatedBalances[t.accountId]) {
            // Determine if transaction adds or subtracts from account
            // INCOME, DEBT_RECEIVED, TRANSFER_IN, DEBT_REPAID (from customer) typically ADD
            // EXPENSE, DEBT_TAKEN(given out), DEBT_GIVEN, TRANSFER_OUT, DEBT_REPAID (to vendor) typically SUBTRACT
            let modifier = 0;

            if (t.type === 'INCOME' || t.type === 'TRANSFER_IN' || t.type === 'DEBT_RECEIVED') {
                modifier = amount;
            } else if (t.type === 'EXPENSE' || t.type === 'TRANSFER_OUT' || t.type === 'DEBT_GIVEN' || t.type === 'DEBT_TAKEN') {
                modifier = -amount;
            } else if (t.type === 'DEBT_REPAID') {
                // If it's paying a vendor, it's money out
                if (t.vendorId) {
                    modifier = -amount;
                } else {
                    // If customer paying us, it's money in
                    modifier = amount;
                }
            }

            accountCalculatedBalances[t.accountId].calculated += modifier;
        }
    }

    // Calculate Advance Payments directly from projects as the dashboard does
    const projects = await prisma.project.findMany();
    let totalAdvancePaid = 0;
    projects.forEach(p => totalAdvancePaid += Number(p.advancePaid));

    let report = `
=== GLOBAL AGGREGATIONS ===
Total Account Balance (Actual): ${totalAccountBalance}

Sum of Transactions by Type:
- INCOME: ${income}
- EXPENSE (Non-Asset): ${expenses}
- FIXED ASSET: ${fixedAssets}
- DEBT_TAKEN (Money Out?): ${debtTaken}
- DEBT_RECEIVED: ${debtReceived}
- DEBT_GIVEN: ${debtGiven}
- DEBT_REPAID: ${debtRepaid}
- TRANSFER IN: ${transferIn}
- TRANSFER OUT: ${transferOut}
- UNKNOWN: ${unknown}

Total Advance Paid recorded in Projects: ${totalAdvancePaid}

=== ACCOUNT MISMATCHES (Actual vs Calculated from Txns) ===
`;

    let mismatchTotal = 0;
    for (const id in accountCalculatedBalances) {
        const acc = accountCalculatedBalances[id];
        const diff = acc.actual - acc.calculated;
        if (Math.abs(diff) > 0.01) {
            report += `Account: ${acc.name} (${id}) | Actual: ${acc.actual} | Txn Sum: ${acc.calculated} | Diff: ${diff}\n`;
            mismatchTotal += diff;
        }
    }

    report += `\nTotal Unaccounted Difference in Accounts: ${mismatchTotal}\n`;
    report += `(Positive diff means the account has more money than its transactions justify. Negative means less.)\n`;

    fs.writeFileSync('audit-mismatch.txt', report);
    console.log("Audit complete. Wrote to audit-mismatch.txt");
}

auditBalanceMismatch().finally(() => prisma.$disconnect());
