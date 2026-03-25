const fs = require('fs');

const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
const trxs = JSON.parse(fs.readFileSync('tmp/ebirr_full_dump.json', 'utf8'));

// Sort by date and creation (Matches lib/accounting.ts)
trxs.sort((a, b) => {
    const dateDiff = new Date(a.transactionDate) - new Date(b.transactionDate);
    if (dateDiff !== 0) return dateDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
});

let bal = 0;
const results = [];

trxs.forEach((t) => {
    const amount = Math.abs(Number(t.amount));
    
    let change = 0;
    
    // 1. Unified Transfer Logic (from lib/accounting.ts)
    if (!t.accountId) {
        if (t.toAccountId === accountId) {
            change = amount;
        } else if (t.fromAccountId === accountId) {
            change = -amount;
        }
    } else {
        // 2. Standard Logic (from lib/accounting.ts)
        if (t.accountId === accountId) {
            const isStandardIn = [
                'INCOME',
                'DEBT_RECEIVED',
                'TRANSFER_IN'
            ].includes(t.type) || (t.type === 'DEBT_REPAID' && (!t.vendorId || !t.expenseId));

            const isStandardOut = [
                'EXPENSE',
                'DEBT_GIVEN',
                'DEBT_TAKEN',
                'TRANSFER_OUT'
            ].includes(t.type) || (t.type === 'DEBT_REPAID' && !!t.vendorId && !!t.expenseId);

            if (isStandardIn) {
                change = amount;
            } else if (isStandardOut) {
                change = -amount;
            }
        }
    }

    bal += change;

    results.push({
        date: t.transactionDate.split('T')[0],
        type: t.type,
        desc: t.description,
        amount: amount,
        change: change,
        bal: bal,
        vendorId: t.vendorId,
        expenseId: t.expenseId,
        id: t.id
    });
});

console.log('Final Balance:', bal);
console.log('Target Balance:', 57000);
console.log('Diff:', bal - 57000);

// Find transactions that might have caused the 27k jump
// (Maybe multiple transactions in a specific period)
console.log('--- Transactions >= 5000 ---');
results.filter(r => Math.abs(r.change) >= 2000).slice(-40).forEach(s => {
    console.log(`${s.date} | ${s.type.padEnd(12)} | ${s.change > 0 ? '+' : '-'} ${Math.abs(s.amount).toString().padStart(10)} | Bal: ${s.bal.toLocaleString().padStart(12)} | ${s.desc}`);
});
