
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkVendorDebt() {
  const name = "Barako compeny";
  const vendor = await prisma.shopVendor.findFirst({
    where: { name }
  });

  if (!vendor) {
    console.log(`Vendor ${name} not found`);
    return;
  }

  console.log(`--- DEBUG: ${name} (ID: ${vendor.id}) ---`);

  // 1. Purchase Orders
  const pos = await prisma.purchaseOrder.findMany({
    where: { vendorId: vendor.id }
  });
  const poDebt = pos.reduce((sum, po) => sum + (po.total - po.paidAmount), 0);
  console.log(`Purchase Orders Debt: ${poDebt}`);
  pos.forEach(p => console.log(`  - PO ${p.poNumber}: Total ${p.total}, Paid ${p.paidAmount}, Status ${p.paymentStatus}`));

  // 2. Unpaid Expenses
  const unpaidExpenses = await prisma.expense.findMany({
    where: { vendorId: vendor.id, paymentStatus: { not: 'PAID' } }
  });
  const expenseDebt = unpaidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  console.log(`Unpaid Expenses Debt: ${expenseDebt}`);
  unpaidExpenses.forEach(e => console.log(`  - Exp ${e.id}: Amount ${e.amount}, Desc ${e.description}, Status ${e.paymentStatus}, PO: ${e.purchaseOrderId}`));

  // 3. Transactions (Debt Taken/Repaid)
  const txs = await prisma.transaction.findMany({
    where: { vendorId: vendor.id, type: { in: ['DEBT_TAKEN', 'DEBT_REPAID', 'DEBT_RECEIVED'] } }
  });
  const txDebt = txs.reduce((sum, t) => {
    const amt = Number(t.amount);
    if (t.type === 'DEBT_TAKEN' || t.type === 'DEBT_RECEIVED') return sum + Math.abs(amt);
    if (t.type === 'DEBT_REPAID') return sum - Math.abs(amt);
    return sum;
  }, 0);
  console.log(`Transactions Debt (Core Loans): ${txDebt}`);
  txs.forEach(t => console.log(`  - TX ${t.id}: Amount ${t.amount}, Type ${t.type}, Desc ${t.description}`));

  console.log('--- END DEBUG ---');
}

checkVendorDebt()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
