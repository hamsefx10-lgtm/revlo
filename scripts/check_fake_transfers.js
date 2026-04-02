const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
  const CBE = 'c8306c05-5279-4b05-b5fc-dda41c793a77';
  const cutoff = new Date('2026-03-17T00:00:00Z');

  const txs = await p.transaction.findMany({
    where: {
      accountId: CBE,
      type: 'TRANSFER_IN',
      transactionDate: { gt: cutoff }
    }
  });

  let fakes = [];
  for (let t of txs) {
    // A legit TRANSFER_IN should have a matching TRANSFER_OUT from the source account
    // Or it might be a unified transfer where fromAccountId is the other account.
    // If it's a legacy transfer (two separate records) there must be a matching out.
    let matchingOut = null;
    if (t.fromAccountId) {
       matchingOut = await p.transaction.findFirst({
         where: {
           accountId: t.fromAccountId,
           type: 'TRANSFER_OUT',
           amount: t.amount,
           transactionDate: t.transactionDate
         }
       });
    }

    if (!matchingOut) {
       fakes.push(t);
    }
  }

  console.log(`\n\n=== E-BIRR TRANSFER_IN AFTER MAR 17 ===`);
  console.log(`Total TRANSFER_IN found: ${txs.length}`);
  console.log(`Potential Fakes (No matching out from source): ${fakes.length}`);

  for (let f of fakes) {
    console.log(`Fake Found: Date: ${f.transactionDate.toISOString().split('T')[0]} | Amount: ${Number(f.amount)} | Desc: ${f.description}`);
  }
}

check()
  .catch(console.error)
  .finally(() => p.$disconnect());
