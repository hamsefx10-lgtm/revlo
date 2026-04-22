const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  // 1. Get Live DB transactions for E-Birr up to March 19
  const liveTxs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    },
    select: { id: true, amount: true, type: true, transactionDate: true, description: true }
  });
  
  const liveTxIds = new Set(liveTxs.map(t => t.id));
  
  // 2. Parse Backup DB transactions
  const dump = fs.readFileSync('railway_dump.sql', 'utf8');
  const backupTxs = [];
  
  // Simple regex to extract ID and amount from backup line
  const lines = dump.split('\n');
  for (const line of lines) {
    if (line.includes('INSERT INTO public.transactions') && line.includes(accountId)) {
      const idMatch = line.match(/VALUES \('([^']+)'/);
      if (idMatch) {
        const id = idMatch[1];
        backupTxs.push({ id, raw: line });
      }
    }
  }
  
  const backupTxIds = new Set(backupTxs.map(t => t.id));
  
  console.log(`Live DB Total E-Birr Txs (all time): ${liveTxIds.size}`);
  console.log(`Backup DB E-Birr Txs: ${backupTxIds.size}`);
  
  // 3. Find missing in Live (Deleted since Backup)
  const missingInLive = [];
  for (const bt of backupTxs) {
    if (!liveTxIds.has(bt.id)) {
      missingInLive.push(bt);
    }
  }
  
  // 4. Find added in Live but not in backup (created after backup)
  const extraInLive = [];
  for (const lt of liveTxs) {
    if (!backupTxIds.has(lt.id)) {
      extraInLive.push(lt);
    }
  }
  
  console.log(`\n--- Transactions DELETED from Live DB since March 19 (Found in Backup, Missing in Live) ---`);
  console.log(`Total missing: ${missingInLive.length}`);
  missingInLive.slice(0, 10).forEach(t => console.log(t.raw.substring(0, 150) + '...'));
  if (missingInLive.length > 10) console.log(`... and ${missingInLive.length - 10} more`);
  
  console.log(`\n--- Transactions ADDED to Live DB since March 19 (Missing in Backup, Found in Live) ---`);
  const extraInLivePast = extraInLive.filter(t => new Date(t.transactionDate) <= new Date('2026-03-20T00:00:00.000Z'));
  console.log(`Total extra (all time): ${extraInLive.length}`);
  console.log(`Total extra (past-dated <= March 19): ${extraInLivePast.length}`);
  
  let diffAmount = 0;
  extraInLivePast.forEach(t => {
    let flow = 0;
    const amt = Math.abs(parseFloat(t.amount.toString()));
    if (['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) flow = amt;
    else if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(t.type)) flow = -amt;
    else flow = -amt; // rough approximation for display
    diffAmount += flow;
    console.log(`[${t.transactionDate.toISOString().split('T')[0]}] ${t.type} ${t.amount} - ${t.description}`);
  });
  
  console.log(`\nRough net flow of past-dated transactions added since backup: ${diffAmount}`);

}

main().finally(() => prisma.$disconnect());
