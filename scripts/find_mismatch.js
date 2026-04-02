const fs = require('fs');

const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
if (startIndex === -1) startIndex = 3;

let diffCount = 0;

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
    let excelInAmt = parseFloat(inAmtStr ? inAmtStr.replace(/,/g, '') : '0') || 0;
    let excelOutAmt = parseFloat(outAmtStr ? outAmtStr.replace(/,/g, '') : '0') || 0;
    let amount = excelInAmt > 0 ? excelInAmt : excelOutAmt;
    let descStr = cols.slice(1, typeIndex).join(' ').trim() || 'Record';
    
    if (amount === 0 && descStr !== 'error') {
         const numbers = [];
         for (let j = typeIndex + 1; j < cols.length; j++) {
             const val = cols[j].replace(/,/g, '').trim();
             if (!isNaN(parseFloat(val)) && isFinite(val)) numbers.push(parseFloat(val));
         }
         amount = numbers.find(n => n > 0) || 0;
         if(excelInAmt === 0 && excelOutAmt === 0) {
            // Assume the amount came from OutAmt
            excelOutAmt = amount; 
         }
    }
    
    if (typeStr === 'DEBT_REPAID' && excelOutAmt > 0) {
        typeStr = 'EXPENSE'; 
    }

    const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'INFLOW'].includes(typeStr) || 
          (typeStr === 'DEBT_REPAID'); // since outAmt>0 gets mapped to EXPENSE above, any DEBT_REPAID left is IN
          
    const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT'].includes(typeStr);

    let dbInAmt = isStandardIn ? amount : 0;
    let dbOutAmt = isStandardOut ? amount : 0;

    if (excelInAmt !== dbInAmt || excelOutAmt !== dbOutAmt) {
        // Did we map IN to OUT or OUT to IN?
        if (amount > 0) {
            console.log(`MISMATCH: ${typeStr} | Excel IN:${excelInAmt} OUT:${excelOutAmt} | DB rules IN: ${dbInAmt} OUT: ${dbOutAmt} | ${descStr}`);
            diffCount++;
        }
    }
}
console.log('Total Mismatched Rows:', diffCount);
