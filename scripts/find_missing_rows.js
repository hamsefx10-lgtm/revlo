const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function x() {
  const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
  let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
  const excelTxs = [];
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    let rawCols = line.split('\t');
    if (rawCols.length < 5 && !line.includes('/')) continue;
    const cols = rawCols.filter(c => c.trim() !== '' && c.trim() !== 'N/A');
    const validTypes = ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEBT_TAKEN', 'DEBT_REPAID', 'DEBT_GIVEN', 'DEBT_RECEIVED'];
    let typeIndex = cols.findIndex(c => validTypes.includes(c.trim()));
    if (typeIndex === -1) continue;
    
    // In migrated script, we took inAmt > 0 ? inAmt : outAmt;
    let inAmt = parseFloat(rawCols[rawCols.length-3]?rawCols[rawCols.length-3].replace(/,/g,''):'0') || 0;
    let outAmt = parseFloat(rawCols[rawCols.length-2]?rawCols[rawCols.length-2].replace(/,/g,''):'0') || 0;
    let amt = inAmt > 0 ? inAmt : outAmt;
    
    let descStr = cols.slice(1, typeIndex).join(' ').trim() || 'Record';
    if (amt === 0 && descStr !== 'error') {
         const numbers = [];
         for (let j = typeIndex + 1; j < cols.length; j++) {
             const val = cols[j].replace(/,/g, '').trim();
             if (!isNaN(parseFloat(val)) && isFinite(val)) numbers.push(parseFloat(val));
         }
         amt = numbers.find(n => n > 0) || 0;
    }
    if (amt === 0 && descStr !== 'error') continue; // This is where we skipped rows!
    if (descStr === 'error') amt = 1;
    
    excelTxs.push({ amt, line });
  }

  const dbTxs = await prisma.transaction.findMany({
    where: { accountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a', transactionDate: { lte: new Date('2026-03-16T23:59:59.999Z') } }
  });
  
  const dbAmts = dbTxs.map(t => typeof t.amount==='object'?t.amount.toNumber():t.amount);
  
  console.log("EXCEL ROWS:", excelTxs.length, "DB ROWS:", dbTxs.length);
  for(let et of excelTxs) {
    const idx = dbAmts.indexOf(et.amt);
    if(idx !== -1) {
      dbAmts.splice(idx, 1);
    } else {
      console.log('MISSING IN DB:', et.amt, "=>", et.line);
    }
  }
}
x().finally(()=>prisma.$disconnect());
