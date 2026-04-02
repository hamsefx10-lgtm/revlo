const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function x() {
  const lines = fs.readFileSync('ebirr_data.txt', 'utf8').split('\n');
  let startIndex = lines.findIndex(l => l.includes('Taariikhda'));
  
  let excelOut = 0;
  let excelIn = 0;
  
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
    
    const inAmtStr = rawCols[rawCols.length - 3];
    const outAmtStr = rawCols[rawCols.length - 2];
    let inAmt = parseFloat(inAmtStr ? inAmtStr.replace(/,/g, '') : '0') || 0;
    let outAmt = parseFloat(outAmtStr ? outAmtStr.replace(/,/g, '') : '0') || 0;
    
    let amount = inAmt > 0 ? inAmt : outAmt;
    let descStr = cols.slice(1, typeIndex).join(' ').trim() || 'Record';
    
    if (amount === 0 && descStr !== 'error') {
         const numbers = [];
         for (let j = typeIndex + 1; j < cols.length; j++) {
             const val = cols[j].replace(/,/g, '').trim();
             if (!isNaN(parseFloat(val)) && isFinite(val)) numbers.push(parseFloat(val));
         }
         amount = numbers.find(n => n > 0) || 0;
         if (inAmt===0 && outAmt===0) { outAmt = amount; } // assume out if empty
    }
    
    if (amount > 0) {
        excelOut += outAmt;
        excelIn += inAmt;
        excelTxs.push({ desc: descStr, inA: inAmt, outA: outAmt, a: amount, type: cols[typeIndex].trim() });
    }
  }

  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const dbTxs = await prisma.transaction.findMany({
    where: { accountId: EBIRR_ID, transactionDate: { lte: new Date('2026-03-16T23:59:59.999Z') } },
    orderBy: { transactionDate: 'asc' }
  });
  
  let dbIn = 0; let dbOut = 0;
  for (let trx of dbTxs) {
      let a = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;
      const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'INFLOW'].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !trx.vendorId && !trx.expenseId && !trx.employeeId && !trx.payrollId);
      const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || (trx.type === 'DEBT_REPAID' && !!trx.vendorId && !!trx.expenseId) || (trx.type === 'DEBT_REPAID' && !!trx.employeeId && !!trx.payrollId);
      
      if (isStandardIn) dbIn += a;
      if (isStandardOut) dbOut += a;
  }
  
  console.log(`EXCEL IN: ${excelIn} OUT: ${excelOut}`);
  console.log(`DB IN: ${dbIn} OUT: ${dbOut}`);
  console.log(`EXCEL RECORDS: ${excelTxs.length}`);
  console.log(`DB RECORDS: ${dbTxs.length}`);
  
  // Find which amount is in Excel but NOT in DB!
  if (excelTxs.length !== dbTxs.length) {
     console.log("RECORD COUNT MISMATCH! Excel has " + excelTxs.length + " but DB has " + dbTxs.length);
  }
}
x().finally(()=>prisma.$disconnect());
