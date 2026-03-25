const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const logStream = fs.createWriteStream('/tmp/barako_log.txt');
  const log = (msg) => {
    console.log(msg);
    logStream.write(msg + '\n');
  };

  const vendors = await prisma.shopVendor.findMany({
    where: {
      name: {
        contains: 'Barako',
        mode: 'insensitive'
      }
    }
  });
  log('VENDORS FOUND: ' + JSON.stringify(vendors, null, 2));

  for (const vendor of vendors) {
    log(`--- DEBUG: ${vendor.name} (${vendor.id}) ---`);
    const pos = await prisma.purchaseOrder.findMany({ where: { vendorId: vendor.id } });
    const exps = await prisma.expense.findMany({ where: { vendorId: vendor.id } });
    const trxs = await prisma.transaction.findMany({ where: { vendorId: vendor.id } });

    log(`  PO COUNT: ${pos.length}`);
    pos.forEach(p => log(`    PO: ${p.poNumber} | Total: ${p.total} | Paid: ${p.paidAmount}`));
    
    log(`  EXP COUNT: ${exps.length}`);
    exps.forEach(e => log(`    EXP: ${e.id} | Amount: ${e.amount} | Status: ${e.paymentStatus} | Desc: ${e.description}`));
    
    log(`  TRX COUNT: ${trxs.length}`);
    trxs.forEach(t => log(`    TX: ${t.id} | Amount: ${t.amount} | Type: ${t.type} | Desc: ${t.description}`));
  }
  logStream.end();
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
