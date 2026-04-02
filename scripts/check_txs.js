const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function x() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const cutoffDate = new Date('2026-03-16T23:59:59.999Z');
  const allTxs = await prisma.transaction.findMany({
    where: { accountId: EBIRR_ID, transactionDate: { lte: cutoffDate } },
    orderBy: { transactionDate: 'desc' },
    include: { vendor: true, expense: true }
  });
  
  let net = 0;
  for (let trx of allTxs) {
      let txAmount = typeof trx.amount === 'object' ? trx.amount.toNumber() : trx.amount;

      const isStandardIn = ['INCOME', 'DEBT_RECEIVED', 'TRANSFER_IN', 'INFLOW'].includes(trx.type) || 
          (trx.type === 'DEBT_REPAID' && !trx.vendorId && !trx.expenseId && !trx.employeeId && !trx.payrollId);

      const isStandardOut = ['EXPENSE', 'DEBT_GIVEN', 'DEBT_TAKEN', 'TRANSFER_OUT', 'ASSET_PURCHASE', 'PAYROLL', 'SALES_REFUND'].includes(trx.type) || 
          (trx.type === 'DEBT_REPAID' && !!trx.vendorId && !!trx.expenseId) || 
          (trx.type === 'DEBT_REPAID' && !!trx.employeeId && !!trx.payrollId);

      if (isStandardIn) net += txAmount;
      if (isStandardOut) net -= txAmount;
  }
  
  const badSumTxs = allTxs.filter(t => t.type === 'EXPENSE' || t.type === 'INCOME');
  
  console.log(`TOTAL RECORDS IN DB BEFORE MAR 16: ${allTxs.length}`);
  console.log(`NET SUM: ${net}`);
}
x().finally(()=>prisma.$disconnect());
