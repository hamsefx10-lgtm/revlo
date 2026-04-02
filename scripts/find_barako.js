const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const bars = await p.shopVendor.findMany({ 
    where: { name: { contains: 'barak', mode: 'insensitive' } } 
  });
  console.log('LIVE VENDORS:');
  for (let b of bars) {
    console.log(`- ID: ${b.id} | Name: ${b.name}`);
    const exp = await p.expense.findMany({ where: { vendorId: b.id } });
    console.log('  Expenses:');
    for (let e of exp) {
       console.log(`    - ID: ${e.id} | Desc: ${e.description} | Amount: ${e.amount}`);
    }
  }
}
check().finally(()=>p.$disconnect());
