const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function x() {
  const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
  let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
  
  let outsum = 0;
  for (let i = startIndex + 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    let rawCols = line.split('\t');
    if (rawCols.length < 5 && !line.includes('/')) continue;
    
    let dateStr = rawCols[0].trim();
    const dParts = dateStr.split('/');
    let jsDate = null;
    if (dParts.length === 3) {
        jsDate = new Date(`${dParts[2]}-${dParts[0].padStart(2, '0')}-${dParts[1].padStart(2, '0')}T12:00:00.000Z`);
    } else {
        jsDate = new Date(dateStr);
    }
    
    // Find the out amt
    const outAmtStr = rawCols[rawCols.length - 2];
    const outAmt = parseFloat(outAmtStr ? outAmtStr.replace(/,/g, '') : '0') || 0;
    
    if (jsDate > new Date('2026-03-16T23:59:59.999Z')) {
        console.log("EXCEL ROW DATED AFTER CUTOFF:", dateStr, "OUT AMOUNT:", outAmt);
        outsum += outAmt;
    }
  }
  console.log("TOTAL EXCEL OUT AMOUNT SKIPPED BY CUTOFF DATE:", outsum);
}
x().finally(()=>prisma.$disconnect());
