const fs = require('fs');
const zlib = require('zlib');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const filePath = 'REVLO_CLOUD_BACKUP_2026-04-12_20-44-39.json.gz';

  // 1. Parse Backup DB
  const fileContents = fs.readFileSync(filePath);
  const unzipped = zlib.gunzipSync(fileContents).toString('utf8');
  const data = JSON.parse(unzipped);
  
  const backupTxs = data.Transaction.filter(t => 
    t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId
  );
  const backupTxMap = new Map(backupTxs.map(t => [t.id, t]));

  // 2. Fetch Live DB
  const liveTxs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    }
  });
  const liveTxMap = new Map(liveTxs.map(t => [t.id, t]));

  console.log(`Live DB Total E-Birr Txs: ${liveTxs.length}`);
  console.log(`Backup DB Total E-Birr Txs: ${backupTxs.length}`);

  // 3. Find MISSING in Live (Deleted since April 12)
  const missingInLive = [];
  for (const bt of backupTxs) {
    if (!liveTxMap.has(bt.id)) {
      missingInLive.push(bt);
    }
  }

  // 4. Find ADDED in Live (Created since April 12, especially those past-dated <= April 12)
  const extraInLive = [];
  for (const lt of liveTxs) {
    if (!backupTxMap.has(lt.id)) {
      extraInLive.push(lt);
    }
  }

  // 5. Compare the Backup Balance vs Live Balance
  const backupAccount = data.Account.find(a => a.id === accountId);
  const liveAccount = await prisma.account.findUnique({ where: { id: accountId } });
  
  console.log(`\n--- BALANCE COMPARISON ---`);
  console.log(`Backup Account Balance (April 12): ${backupAccount.balance}`);
  console.log(`Live Account Balance (Now): ${liveAccount.balance}`);

  console.log(`\n--- DELETED TRANSACTIONS (In Backup, Missing from Live) ---`);
  console.log(`Total Deleted: ${missingInLive.length}`);
  let deletedNetFlow = 0;
  missingInLive.forEach(t => {
    let amt = Math.abs(parseFloat(t.amount));
    if (['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) deletedNetFlow += amt;
    else if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(t.type)) deletedNetFlow -= amt;
    else deletedNetFlow -= amt;

    console.log(`[${new Date(t.transactionDate).toISOString().split('T')[0]}] ${t.type} ${t.amount} - ${t.description}`);
  });

  console.log(`\n--- TRANSACTIONS ADDED PAST-DATED (Created after April 12, Dated <= April 12) ---`);
  const pastDated = extraInLive.filter(t => new Date(t.transactionDate) <= new Date('2026-04-12T23:59:59.000Z'));
  console.log(`Total Past-Dated Added: ${pastDated.length}`);
  
  // List them all if not too many
  pastDated.slice(0, 10).forEach(t => {
    console.log(`[${new Date(t.transactionDate).toISOString().split('T')[0]}] ${t.type} ${t.amount} - ${t.description}`);
  });
  if (pastDated.length > 10) console.log(`... and ${pastDated.length - 10} more`);

  console.log(`\n--- NEW TRANSACTIONS DATED AFTER APRIL 12 ---`);
  const properlyDated = extraInLive.filter(t => new Date(t.transactionDate) > new Date('2026-04-12T23:59:59.000Z'));
  console.log(`Total New Properly Dated: ${properlyDated.length}`);
  properlyDated.forEach(t => {
    console.log(`[${new Date(t.transactionDate).toISOString().split('T')[0]}] ${t.type} ${t.amount} - ${t.description}`);
  });

}

main().finally(() => prisma.$disconnect());
