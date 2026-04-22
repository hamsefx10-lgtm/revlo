const fs = require('fs');
const zlib = require('zlib');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const filePath = 'REVLO_CLOUD_BACKUP_2026-04-12_20-44-39.json.gz';

  const fileContents = fs.readFileSync(filePath);
  const unzipped = zlib.gunzipSync(fileContents).toString('utf8');
  const data = JSON.parse(unzipped);
  
  const backupAccount = data.Account.find(a => a.id === accountId);
  const backupBal = backupAccount ? parseFloat(backupAccount.balance) : 0;

  const liveTxs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    }
  });

  const liveAccount = await prisma.account.findUnique({ where: { id: accountId } });
  
  // Calculate flow since April 12 backup using ONLY live transactions that are NEW
  const backupTxs = data.Transaction.filter(t => 
    t.accountId === accountId || t.fromAccountId === accountId || t.toAccountId === accountId
  );
  const backupTxIds = new Set(backupTxs.map(t => t.id));
  const liveTxIds = new Set(liveTxs.map(t => t.id));

  let addedFlow = 0;
  for (const t of liveTxs) {
    if (!backupTxIds.has(t.id)) {
      let flow = 0;
      let amt = Math.abs(parseFloat(t.amount));
      if (['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) flow = amt;
      else if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(t.type)) flow = -amt;
      else flow = -amt;
      addedFlow += flow;
    }
  }

  let deletedFlow = 0;
  for (const t of backupTxs) {
    if (!liveTxIds.has(t.id)) {
      let flow = 0;
      let amt = Math.abs(parseFloat(t.amount));
      if (['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) flow = amt;
      else if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(t.type)) flow = -amt;
      else flow = -amt;
      deletedFlow += flow;
    }
  }

  console.log(`Backup Balance (April 12): ${backupBal}`);
  console.log(`Live Account Balance (Now DB): ${liveAccount.balance}`);
  
  // If the app correctly updated the balance for every added and deleted transaction:
  const expectedBalance = backupBal + addedFlow - deletedFlow;
  
  console.log(`\nFlow Added: ${addedFlow}`);
  console.log(`Flow Deleted: ${deletedFlow}`);
  console.log(`Expected Balance (Backup + Added - Deleted): ${expectedBalance}`);

}

main().finally(() => prisma.$disconnect());
