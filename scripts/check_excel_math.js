const fs = require('fs');

const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
if (startIndex === -1) startIndex = 3;

let totalIn = 0;
let totalOut = 0;
let lastBal = 0;

for (let i = startIndex + 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    let rawCols = line.split('\t');
    if (rawCols.length < 5 && !line.includes('/')) continue;
    
    // In Excel: La Xiriira (4), Soo Galay (In) (5), Baxay (Out) (6), Bal (7)
    const inAmtStr = rawCols[rawCols.length - 3];
    const outAmtStr = rawCols[rawCols.length - 2];
    const balAmtStr = rawCols[rawCols.length - 1];
    
    const inAmt = parseFloat(inAmtStr ? inAmtStr.replace(/,/g, '') : '0') || 0;
    const outAmt = parseFloat(outAmtStr ? outAmtStr.replace(/,/g, '') : '0') || 0;
    const balAmt = parseFloat(balAmtStr ? balAmtStr.replace(/,/g, '') : '0') || 0;
    
    totalIn += inAmt;
    totalOut += outAmt;
    if (balAmt !== 0) lastBal = balAmt;
}

console.log('EXCEL SUM IN:', totalIn);
console.log('EXCEL SUM OUT:', totalOut);
console.log('EXCEL NET:', totalIn - totalOut);
console.log('EXCEL LAST WRITTEN BALANCE:', lastBal);
