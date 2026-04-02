const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  const EBIRR_ID = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const CBE_ID = '123565af-cc2c-47ea-bdff-c23f2ec55e5d'; // Let's dynamically find CBE ID since I don't remember it!
  
  const cbeAcc = await prisma.account.findFirst({ where: { name: { contains: 'CBE', mode: 'insensitive' } } });
  if (!cbeAcc) {
      console.log('CBE account not found!');
      return;
  }
  const ACTIVE_CBE_ID = cbeAcc.id;

  const cutoff = new Date('2026-03-16T23:59:59.999Z');
  
  // Get all transactions for E-Birr and CBE after cutoff
  const allTxs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: EBIRR_ID }, { fromAccountId: EBIRR_ID }, { toAccountId: EBIRR_ID },
        { accountId: ACTIVE_CBE_ID }, { fromAccountId: ACTIVE_CBE_ID }, { toAccountId: ACTIVE_CBE_ID }
      ],
      transactionDate: { gt: cutoff }
    }
  });

  const issues = [];

  // Group by standalone and dual-ledger
  const unifiedTransfers = allTxs.filter(t => !t.accountId && t.fromAccountId && t.toAccountId);
  const dualTransfers = allTxs.filter(t => t.accountId && ['TRANSFER_IN', 'TRANSFER_OUT'].includes(t.type));

  console.log(`Analyzing ${unifiedTransfers.length} Unified Transfers and ${dualTransfers.length} Dual-Leg Transfers...`);

  // 1. Check Unified Transfers (Modern way)
  for (let t of unifiedTransfers) {
     if (t.fromAccountId === EBIRR_ID && t.toAccountId === ACTIVE_CBE_ID) {
         // This perfectly links both
         continue; 
     }
     if (t.fromAccountId === ACTIVE_CBE_ID && t.toAccountId === EBIRR_ID) {
         continue;
     }
  }

  // 2. Check Dual Transfers for orphans
  // E-Birr claiming it sent to CBE => TRANSFER_OUT from E-Birr
  const ebirrOuts = dualTransfers.filter(t => t.accountId === EBIRR_ID && t.type === 'TRANSFER_OUT');
  // E-Birr claiming it received from CBE => TRANSFER_IN to E-Birr
  const ebirrIns = dualTransfers.filter(t => t.accountId === EBIRR_ID && t.type === 'TRANSFER_IN');
  
  // CBE claiming it sent to E-Birr => TRANSFER_OUT from CBE
  const cbeOuts = dualTransfers.filter(t => t.accountId === ACTIVE_CBE_ID && t.type === 'TRANSFER_OUT');
  // CBE claiming it received from E-Birr => TRANSFER_IN to CBE
  const cbeIns = dualTransfers.filter(t => t.accountId === ACTIVE_CBE_ID && t.type === 'TRANSFER_IN');

  // Match E-Birr OUT with CBE IN
  for (let eOut of ebirrOuts) {
      // Look for a match in CBE INs
      const amtE = typeof eOut.amount === 'object' ? eOut.amount.toNumber() : eOut.amount;
      
      // If it doesn't mention CBE in description, maybe it's not for CBE. But we check anyway if the user wants.
      // Usually descriptions will say CBE or Birshiil etc.
      if (!eOut.description.toLowerCase().includes('cbe')) continue; // only care about ones targeting CBE

      const match = cbeIns.find(cIn => {
          const amtC = typeof cIn.amount === 'object' ? cIn.amount.toNumber() : cIn.amount;
          return amtC === amtE && cIn.transactionDate.getTime() === eOut.transactionDate.getTime();
      });

      if (!match) {
          issues.push(`🔥 E-Birr sent ${amtE} to CBE on ${eOut.transactionDate.toISOString().split('T')[0]} but CBE NEVER received it (Missing TRANSFER_IN on CBE). Description: "${eOut.description}"`);
      }
  }

  // Match CBE OUT with E-Birr IN
  for (let cOut of cbeOuts) {
      const amtC = typeof cOut.amount === 'object' ? cOut.amount.toNumber() : cOut.amount;
      
      // If description target is Birshiil / ebirr
      if (!cOut.description.toLowerCase().includes('birshiil') && !cOut.description.toLowerCase().includes('ebirr') && !cOut.description.toLowerCase().includes('e-birr')) continue;

      const match = ebirrIns.find(eIn => {
          const amtE = typeof eIn.amount === 'object' ? eIn.amount.toNumber() : eIn.amount;
          return amtE === amtC && eIn.transactionDate.getTime() === cOut.transactionDate.getTime();
      });

      if (!match) {
          issues.push(`🔥 CBE sent ${amtC} to E-Birr on ${cOut.transactionDate.toISOString().split('T')[0]} but E-Birr NEVER received it (Or it was DELETED from E-Birr!). Description: "${cOut.description}"`);
      }
  }

  // Check the reverse (Orphans left behind when the sender deleted)
  for (let cIn of cbeIns) {
      const amtC = typeof cIn.amount === 'object' ? cIn.amount.toNumber() : cIn.amount;
      if (!cIn.description.toLowerCase().includes('birshiil') && !cIn.description.toLowerCase().includes('ebirr')) continue;

      const match = ebirrOuts.find(eOut => {
          const amtE = typeof eOut.amount === 'object' ? eOut.amount.toNumber() : eOut.amount;
          return amtE === amtC && eOut.transactionDate.getTime() === cIn.transactionDate.getTime();
      });

      if (!match) {
          issues.push(`👻 CBE received ${amtC} on ${cIn.transactionDate.toISOString().split('T')[0]} from E-Birr, BUT E-Birr has no record of sending it! (Orphaned Record in CBE). Description: "${cIn.description}"`);
      }
  }

  for (let eIn of ebirrIns) {
      const amtE = typeof eIn.amount === 'object' ? eIn.amount.toNumber() : eIn.amount;
      if (!eIn.description.toLowerCase().includes('cbe')) continue;

      const match = cbeOuts.find(cOut => {
          const amtC = typeof cOut.amount === 'object' ? cOut.amount.toNumber() : cOut.amount;
          return amtC === amtE && cOut.transactionDate.getTime() === eIn.transactionDate.getTime();
      });

      if (!match) {
          issues.push(`👻 E-Birr received ${amtE} on ${eIn.transactionDate.toISOString().split('T')[0]} from CBE, BUT CBE has no record of sending it! (Orphaned Record in E-Birr). Description: "${eIn.description}"`);
      }
  }

  if (issues.length === 0) {
      console.log('✅ ALL E-Birr and CBE transfers MATCH PERFECTLY after March 16. No orphans or missing records found.');
  } else {
      console.log('⚠️ ANOMALIES FOUND:');
      issues.forEach(i => console.log(i));
  }
}

audit().finally(()=>prisma.$disconnect());
