const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const amounts = [13180, -13180, 208000, -208000, 60000, -60000];
  const trxs = await prisma.transaction.findMany({
    where: {
      OR: amounts.map(a => ({ amount: a }))
    },
    include: {
      vendor: true,
      expense: true,
      account: true,
      fromAccount: true
    }
  });

  fs.writeFileSync('/tmp/find_albarako_trxs.json', JSON.stringify(trxs, null, 2));
  console.log('FOUND ' + trxs.length + ' TRANSACTIONS');
}

main().catch(console.error).finally(() => prisma.$disconnect());
