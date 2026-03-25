const fs = require('fs');

const trxs = JSON.parse(fs.readFileSync('tmp/ebirr_dump.json', 'utf8'));

// Sort by date and creation
trxs.sort((a, b) => {
    const dateDiff = new Date(a.transactionDate) - new Date(b.transactionDate);
    if (dateDiff !== 0) return dateDiff;
    return new Date(a.createdAt) - new Date(b.createdAt);
});

let bal = 0;
const results = [];

trxs.forEach((t) => {
    const amount = Math.abs(Number(t.amount));
    
    // Logic from the fix
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

    let change = 0;
    if (isStandardIn) {
        bal += amount;
        change = amount;
    } else if (isStandardOut) {
        bal -= amount;
        change = -amount;
    }

    results.push({
        date: t.transactionDate.split('T')[0],
        type: t.type,
        desc: t.description,
        amount: amount,
        change: change,
        bal: bal,
        vendorId: t.vendorId,
        expenseId: t.expenseId
    });
});

// Output suspicious transactions or the whole list if short
console.log('Final Balance:', bal);
console.log('Target Balance:', 57000);
console.log('Diff:', bal - 57000);

// Find transactions with suspicious changes or specific amounts
const suspicious = results.filter(r => r.amount >= 1000);
console.log('--- Transactions >= 1000 ---');
suspicious.slice(-30).forEach(s => {
    console.log(`${s.date} | ${s.type.padEnd(12)} | ${s.change > 0 ? '+' : '-'} ${Math.abs(s.amount).toString().padStart(10)} | Bal: ${s.bal.toLocaleString()} | ${s.desc}`);
});
