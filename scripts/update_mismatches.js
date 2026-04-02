const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function update() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  
  // The 6 records that were TRANSFER_OUT but Excel put them as IN.
  const amounts = [126610.01, 60000, 20000, 2200];
  
  const ids = await prisma.transaction.findMany({
    where: { 
        accountId, 
        type: 'TRANSFER_OUT',
        OR: amounts.map(a => ({ amount: a }))
    }
  });
  
  console.log('Found', ids.length, 'records to fix!');
  let fixed = 0;
  for(let r of ids) {
    if (r.description.toLowerCase().includes('wareejin')) {
       await prisma.transaction.update({
         where: { id: r.id },
         data: { type: 'TRANSFER_IN' } // Flips them to IN so math matches Excel
       });
       fixed++;
    }
  }
  
  // We must also trigger the Frontend update via the ping trick
  await prisma.transaction.updateMany({
       where: { accountId }, data: { updatedAt: new Date() }
  });
  
  console.log('Fixed', fixed, 'mismatches natively!');
}
update().finally(()=>prisma.$disconnect());
