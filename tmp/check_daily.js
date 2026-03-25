const fs = require('fs');

const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
const trxs = JSON.parse(fs.readFileSync('tmp/ebirr_full_dump.json', 'utf8'));

trxs.sort((a, b) => {
    const dateDiff = new Date(a.transactionDate) - new Date(b.transactionDate);
    if (dateDiff !== 0) return dateDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
});

let bal = 0;
const balancesAtDate = {};

trxs.forEach((t) => {
    const amount = Math.abs(Number(t.amount));
    let change = 0;

    if (!t.accountId) {
        if (t.toAccountId === accountId) change = amount;
        else if (t.fromAccountId === accountId) change = -amount;
    } else if (t.accountId === accountId) {
        const isStandardIn = ['INCOME','DEBT_RECEIVED','TRANSFER_IN'].includes(t.type) || (t.type === 'DEBT_REPAID' && (!t.vendorId || !t.expenseId));
        const isStandardOut = ['EXPENSE','DEBT_GIVEN','DEBT_TAKEN','TRANSFER_OUT'].includes(t.type) || (t.type === 'DEBT_REPAID' && !!t.vendorId && !!t.expenseId);
        if (isStandardIn) change = amount;
        else if (isStandardOut) change = -amount;
    }
    
    bal += change;
    const dateStr = t.transactionDate.split('T')[0];
    balancesAtDate[dateStr] = bal;
});

console.log('--- Account Balances ---');
Object.keys(balancesAtDate).sort().forEach(d => {
    if (d.startsWith('2026-03')) {
        console.log(`${d} | Bal: ${balancesAtDate[d].toFixed(2)}`);
    }
});
