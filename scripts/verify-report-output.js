const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const companyId = '0812738a-3e0e-436f-b25c-89a31a986c47'; // Main company
  
  // Get expenses and transactions like the API
  const allExpenses = await prisma.expense.findMany({ where: { companyId }, include: { vendor: true, project: true } });
  const allTransactions = await prisma.transaction.findMany({ where: { companyId }, include: { vendor: true, project: true } });

  const vendorDebtMap = {};

  // Expense matching
  allExpenses.forEach(e => {
    if (!e.vendorId) return;
    const key = `${e.vendorId}_${e.projectId || 'general'}`;
    if (!vendorDebtMap[key]) vendorDebtMap[key] = { name: e.vendor.name, amount: 0, paid: 0, proj: e.projectId };
    vendorDebtMap[key].amount += Math.abs(Number(e.amount));
  });

  // Transaction matching
  allTransactions.forEach(t => {
    if (!t.vendorId) return;
    const key = `${t.vendorId}_${t.projectId || 'general'}`;
    if (!vendorDebtMap[key]) vendorDebtMap[key] = { name: t.vendor.name, amount: 0, paid: 0, proj: t.projectId };
    
    if (t.type === 'DEBT_TAKEN' && !t.expenseId) vendorDebtMap[key].amount += Math.abs(Number(t.amount));
    if (t.type === 'DEBT_REPAID' || t.type === 'EXPENSE') vendorDebtMap[key].paid += Math.abs(Number(t.amount));
  });

  console.log('--- FINAL REPORT PREVIEW ---');
  Object.values(vendorDebtMap).forEach(v => {
    if (v.name.includes('Barako')) {
      console.log(`${v.name} (${v.proj || 'General'}) | AMT: ${v.amount} | PAID: ${v.paid} | REM: ${v.amount - v.paid}`);
    }
  });
}

verify().catch(console.error).finally(() => prisma.$disconnect());
