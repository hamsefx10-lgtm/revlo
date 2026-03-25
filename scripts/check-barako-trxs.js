const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const trxs = await prisma.transaction.findMany({
    where: { vendorId: '7a106acd-7659-4d8f-8289-3f3e683e89a0' },
    include: {
      expense: true
    }
  });
  fs.writeFileSync('/tmp/barako_trx_final.json', JSON.stringify(trxs, null, 2));
  console.log('FETCHED ' + trxs.length + ' TRANSACTIONS');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
