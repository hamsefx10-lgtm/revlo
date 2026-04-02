const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function findCBEPre() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const cbeAcc = await prisma.account.findFirst({ where: { name: { contains: 'CBE', mode: 'insensitive' } } });
  
  if (!cbeAcc) return;

  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: EBIRR_ID },
        { accountId: cbeAcc.id },
        { fromAccountId: cbeAcc.id },
        { toAccountId: cbeAcc.id }
      ],
      transactionDate: {
        gte: new Date('2026-03-21T00:00:00.000Z'),
        lte: new Date('2026-03-26T23:59:59.999Z')
      }
    },
    orderBy: { transactionDate: 'asc' }
  });

  const cbeTransfers = [];
  for(let t of txs) {
      if (typeof t.amount === 'object') t.amount = t.amount.toNumber();
      
      let involveCBE = t.accountId === cbeAcc.id || t.fromAccountId === cbeAcc.id || t.toAccountId === cbeAcc.id;
      let involveEbirr = t.accountId === EBIRR_ID || t.fromAccountId === EBIRR_ID || t.toAccountId === EBIRR_ID;
      
      let desc = t.description.toLowerCase();
      if ((involveCBE && involveEbirr) || (involveEbirr && desc.includes('cbe')) || (involveCBE && desc.includes('birr'))) {
         cbeTransfers.push(`${t.transactionDate.toISOString().split('T')[0]} | ${t.description} | ${t.type} | Amt: ${t.amount}`);
      }
  }

  const result = `FOUND ${cbeTransfers.length} transfers between E-Birr and CBE for dates 21-26:\n` + [...new Set(cbeTransfers)].join('\n');
  fs.writeFileSync('tmp/cbe_transfers.txt', result, 'utf8');
}

findCBEPre().then(()=>prisma.$disconnect());
