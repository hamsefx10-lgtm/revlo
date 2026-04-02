const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function x() {
  const allTxs = await prisma.transaction.findMany({
    where: { accountId: '3c156507-ea0a-4974-8a54-92f1e9dd519a' }
  });
  
  let dbOut = 0;
  for (let trx of allTxs) {
      if (trx.transactionDate > new Date('2026-03-16T23:59:59.999Z')) continue;

      let a = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;
      const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || 
          (trx.type === 'DEBT_REPAID' && !!trx.vendorId && !!trx.expenseId) || 
          (trx.type === 'DEBT_REPAID' && !!trx.employeeId && !!trx.payrollId);
      
      const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'INFLOW'].includes(trx.type) || 
          (trx.type === 'DEBT_REPAID' && !trx.vendorId && !trx.expenseId && !trx.employeeId && !trx.payrollId);

      if (isStandardOut) dbOut += a;

      if (!isStandardOut && !isStandardIn) {
          console.log("NOT CATEGORIZED MATH:", trx.type, a);
      }
  }
  console.log('DB OUT:', dbOut);
}
x().finally(()=>prisma.$disconnect());
