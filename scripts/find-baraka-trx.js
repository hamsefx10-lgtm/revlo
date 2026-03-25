const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const trxs = await prisma.transaction.findMany({
    where: {
      OR: [
        { description: { contains: 'Baraka', mode: 'insensitive' } },
        { note: { contains: 'Baraka', mode: 'insensitive' } }
      ]
    },
    include: {
      user: true,
      vendor: true,
      customer: true
    }
  });
  fs.writeFileSync('/tmp/baraka_trx_result.json', JSON.stringify(trxs, null, 2));
  console.log('FOUND ' + trxs.length + ' TRANSACTIONS');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
