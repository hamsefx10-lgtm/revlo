const fs = require('fs');

const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
if (startIndex === -1) startIndex = 3;

let excelOut = 0;
let validRowsOut = 0;

for (let i = startIndex + 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    let rawCols = line.split('\t');
    if (rawCols.length < 5 && !line.includes('/')) continue;
    
    const cols = rawCols.filter(c => c.trim() !== '' && c.trim() !== 'N/A');
    const validTypes = ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEBT_TAKEN', 'DEBT_REPAID', 'DEBT_GIVEN', 'DEBT_RECEIVED'];
    let typeIndex = cols.findIndex(c => validTypes.includes(c.trim()));
    if (typeIndex === -1) continue;
    
    // Raw sum
    const outAmtStr = rawCols[rawCols.length - 2];
    const outAmt = parseFloat(outAmtStr ? outAmtStr.replace(/,/g, '') : '0') || 0;
    excelOut += outAmt;
    
    // Logic parsed sum
    let amount = 0;
    let descStr = cols.slice(1, typeIndex).join(' ').trim() || 'Record';
    
    const inAmtStr = rawCols[rawCols.length - 3];
    const inAmt = parseFloat(inAmtStr ? inAmtStr.replace(/,/g, '') : '0') || 0;
    amount = outAmt; 
    
    if (inAmt === 0 && outAmt === 0 && descStr !== 'error') {
         const numbers = [];
         for (let j = typeIndex + 1; j < cols.length; j++) {
             const val = cols[j].replace(/,/g, '').trim();
             if (!isNaN(parseFloat(val)) && isFinite(val)) numbers.push(parseFloat(val));
         }
         // Assumed to be OUT because we didn't see an IN?
         amount = numbers.length > 1 ? parseFloat(numbers[0]) : 0;
    }
    validRowsOut += amount;
    
    if (outAmt !== amount) console.log("DIFF OUT PARSING:", outAmt, amount, line);
}

console.log('EXCEL RAW OUT:', excelOut);
console.log('LOGIC PARSED OUT:', validRowsOut);
