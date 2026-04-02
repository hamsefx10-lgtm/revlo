const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function x() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const cutoffDate = new Date('2026-03-16T23:59:59.999Z');
  const allTxs = await prisma.transaction.findMany({
    where: { accountId: EBIRR_ID, transactionDate: { lte: cutoffDate } },
    orderBy: { transactionDate: 'asc' }
  });
  
  let dbIn = 0; let dbOut = 0;
  
  for (let trx of allTxs) {
      let txAmount = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;

      const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'INFLOW'].includes(trx.type) || 
          (trx.type === 'DEBT_REPAID' && !trx.vendorId && !trx.expenseId && !trx.employeeId && !trx.payrollId);

      const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || 
          (trx.type === 'DEBT_REPAID' && !!trx.vendorId && !!trx.expenseId) || 
          (trx.type === 'DEBT_REPAID' && !!trx.employeeId && !!trx.payrollId);

      // What happens if it's NEITHER? E.g. random type strings!
      if (!isStandardIn && !isStandardOut) {
           console.log("NOT CATEGORIZED MATH:", trx.type, txAmount);
      }

      const excelRow = trx.description; // We didn't save the exact Excel "In" or "Out" flags,
      // but we can parse the txt again.
      
      if (isStandardIn) dbIn += txAmount;
      if (isStandardOut) dbOut += txAmount;
  }
  
  console.log(`DB Computed IN: ${dbIn}`);
  console.log(`DB Computed OUT: ${dbOut}`);
}
x().finally(()=>prisma.$disconnect());
