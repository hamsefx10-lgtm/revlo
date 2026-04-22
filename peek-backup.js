const fs = require('fs');
const zlib = require('zlib');

const filePath = 'REVLO_CLOUD_BACKUP_2026-04-12_20-44-39.json.gz';

const fileContents = fs.readFileSync(filePath);
const unzipped = zlib.gunzipSync(fileContents).toString('utf8');

const data = JSON.parse(unzipped);
console.log('Keys in backup:', Object.keys(data));

// If it has tables or similar structure, let's find where transactions are
if (data.Transaction) {
  console.log('Total Transactions in backup:', data.Transaction.length);
  // check one E-birr tx
  const ebirrTxs = data.Transaction.filter(t => 
    t.accountId === '3c156507-ea0a-4974-8a54-92f1e9dd519a' ||
    t.fromAccountId === '3c156507-ea0a-4974-8a54-92f1e9dd519a' ||
    t.toAccountId === '3c156507-ea0a-4974-8a54-92f1e9dd519a'
  );
  console.log('Total E-birr Txs in backup:', ebirrTxs.length);
} else if (data.transactions) {
  console.log('Total Transactions in backup:', data.transactions.length);
}
