
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllVendorData() {
  const name = "Barako compeny";
  const vendor = await prisma.shopVendor.findFirst({
    where: { name },
    include: {
      transactions: true,
      expenses: true,
      purchaseOrders: true
    }
  });

  if (!vendor) {
    console.log(`Vendor ${name} not found`);
    return;
  }

  console.log(`--- COMPLETE DEBUG: ${name} ---`);
  
  console.log('PURCHASE ORDERS:');
  vendor.purchaseOrders.forEach(p => console.log(`  PO: ${p.poNumber} | Total: ${p.total} | Paid: ${p.paidAmount}`));
  
  console.log('EXPENSES:');
  vendor.expenses.forEach(e => console.log(`  EXP: ${e.id} | Amount: ${e.amount} | Status: ${e.paymentStatus} | Desc: ${e.description}`));

  console.log('TRANSACTIONS:');
  vendor.transactions.forEach(t => console.log(`  TX: ${t.id} | Amount: ${t.amount} | Type: ${t.type} | Desc: ${t.description}`));

  console.log('--- END DEBUG ---');
}

checkAllVendorData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
