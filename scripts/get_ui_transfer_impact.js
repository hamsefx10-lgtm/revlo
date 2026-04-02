const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getImpact() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { toAccountId: EBIRR_ID },
        { fromAccountId: EBIRR_ID }
      ],
      accountId: { not: null } // This indicates it's an old dual-ledger transfer, or a new unified one where E-Birr is NOT the initiator
    }
  });

  let sum = 0;
  for(let t of txs) {
      if (t.accountId === EBIRR_ID) {
          // If E-Birr is the initiator, it's handled by standard rules, NOT transfer rules in route.ts!
          continue; 
      }
      
      let amount = typeof t.amount === 'object' ? t.amount.toNumber() : t.amount;
      
      if (t.toAccountId === EBIRR_ID) {
          sum += amount;
      } else if (t.fromAccountId === EBIRR_ID) {
          sum -= amount;
      }
  }

  console.log(`TOTAL TRANSFER ROWS AFFECTING UI BALANCE: ${txs.length}`);
  console.log(`TOTAL NET IMPACT ON EBIRR RUNNING BALANCE: ${sum}`);
}
getImpact().finally(()=>prisma.$disconnect());
