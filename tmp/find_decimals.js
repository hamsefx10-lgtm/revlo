const fs = require('fs');
const trxs = JSON.parse(fs.readFileSync('tmp/ebirr_full_dump.json', 'utf8'));
trxs.filter(t => Number(t.amount) % 1 !== 0).forEach(t => {
    console.log(`${t.amount} | ${t.description} | ${t.type}`);
});
