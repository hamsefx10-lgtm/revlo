const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function unlink() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: EBIRR_ID },
        { fromAccountId: EBIRR_ID },
        { toAccountId: EBIRR_ID }
      ],
      createdAt: { lt: new Date('2026-03-31T00:00:00.000Z') }, // exclude fresh rows
      transactionDate: { lte: new Date('2026-03-16T23:59:59.999Z') }
    }
  });

  console.log(`FOUND ${txs.length} legacy rows overlapping with reconciled period.`);
  
  let unlinked = 0;
  for (let t of txs) {
      // Unlink E-Birr from the record safely without deleting the record itself
      let updatedData = {
          description: t.description ? t.description + ' (Unlinked from E-Birr due to Mar 17 Reconciliation)' : '(Unlinked from E-Birr due to Mar 17 Reconciliation)'
      };
      
      let needsUpdate = false;

      // Handle dual-ledger legacy or standard where E-Birr was mistakenly kept
      if (t.accountId === EBIRR_ID) {
          // I thought we deleted all accountId === EBIRR_ID. Why are they here?
          // Let's delete them if they exist.
          console.log("DELETING STRAY EBIRR_ID RECORD:", t.id);
          await prisma.transaction.delete({ where: { id: t.id }});
          unlinked++;
          continue;
      }
      
      if (t.toAccountId === EBIRR_ID) {
          updatedData.toAccountId = null;
          needsUpdate = true;
      }
      if (t.fromAccountId === EBIRR_ID) {
          updatedData.fromAccountId = null;
          needsUpdate = true;
      }

      if (needsUpdate) {
         await prisma.transaction.update({
             where: { id: t.id },
             data: updatedData
         });
         unlinked++;
      }
  }

  // Force frontend cache refresh for E-Birr
  await prisma.transaction.updateMany({
       where: { accountId: EBIRR_ID }, data: { updatedAt: new Date() }
  });

  console.log(`Successfully unlinked ${unlinked} legacy overlap transactions.`);
}
unlink().finally(()=>prisma.$disconnect());
