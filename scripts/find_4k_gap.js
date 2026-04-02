const fs = require('fs');

const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
if (startIndex === -1) startIndex = 3;

let outDiffTxs = [];

for (let i = startIndex + 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    let rawCols = line.split('\t');
    if (rawCols.length < 5 && !line.includes('/')) continue;
    
    const cols = rawCols.filter(c => c.trim() !== '' && c.trim() !== 'N/A');
    const validTypes = ['INCOME', 'EXPENSE', 'TRANSFER_IN', 'TRANSFER_OUT', 'DEBT_TAKEN', 'DEBT_REPAID', 'DEBT_GIVEN', 'DEBT_RECEIVED'];
    let typeIndex = cols.findIndex(c => validTypes.includes(c.trim()));
    if (typeIndex === -1) continue;
    let typeStr = cols[typeIndex].trim();
    
    const inAmtStr = rawCols[rawCols.length - 3];
    const outAmtStr = rawCols[rawCols.length - 2];
    let excelOutAmt = parseFloat(outAmtStr ? outAmtStr.replace(/,/g, '') : '0') || 0;
    
    // Logically mapped amount inside migrate script
    let amount = parseFloat(inAmtStr ? inAmtStr.replace(/,/g, '') : '0') || 0;
    if (amount === 0) amount = excelOutAmt;
    let descStr = cols.slice(1, typeIndex).join(' ').trim() || 'Record';
    
    if (amount === 0 && descStr !== 'error') {
         const numbers = [];
         for (let j = typeIndex + 1; j < cols.length; j++) {
             const val = cols[j].replace(/,/g, '').trim();
             if (!isNaN(parseFloat(val)) && isFinite(val)) numbers.push(parseFloat(val));
         }
         amount = numbers.find(n => n > 0) || 0;
    }
    
    // If the logical amount differed from the raw out amount.
    // In db check, `dbOut` was amount but it was 8709994.89 while `excelOut` was 8714211.89.
    // The sum is ExcelOut - DBOut = 4217 exactly.
    if (excelOutAmt > 0 && excelOutAmt !== amount) {
        outDiffTxs.push({ desc: descStr, excelOut: excelOutAmt, mappedAmount: amount});
    }
}
console.log('Out differences between Raw Excel and Mapped Logic:');
console.log(outDiffTxs);
