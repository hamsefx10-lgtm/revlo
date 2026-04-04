const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function run() {
  const assets = await prisma.fixedAsset.findMany({
    where: { 
      name: { in: ['JigSaw', 'Shuter'] } 
    }
  });

  const txs = await prisma.transaction.findMany({
    where: { 
      amount: { in: [11000, 6500] } 
    }
  });

  const txToUpdate = txs.filter(t => t.description && (t.description.includes('JigSaw') || t.description.includes('Shuter')));
  
  const result = `Assets: ${JSON.stringify(assets, null, 2)}\n\nTransactions: ${JSON.stringify(txToUpdate, null, 2)}`;
  fs.writeFileSync('tmp/check_assets_output.txt', result);
}

run().then(() => prisma.$disconnect()).catch(console.error);
