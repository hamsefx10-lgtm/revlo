const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function run() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const bx = await p.transaction.findMany({ 
    where: { 
      OR: [
        { accountId: accountId }, { fromAccountId: accountId }, { toAccountId: accountId }
      ]
    } 
  });
  let typeSum = {};
  
  bx.forEach(t => {
    let amt = Math.abs(Number(t.amount));
    typeSum[t.type] = (typeSum[t.type] || 0) + amt;
  });
  
  console.log('Aggregated ABSOLUTE Data from Live Database for Birshiil (3c156507-ea0a-4974-8a54-92f1e9dd519a):');
  for(const [type, amt] of Object.entries(typeSum)) {
    console.log(`- ${type}: ${amt.toFixed(2)}`);
  }
}
run().finally(()=>p.$disconnect());
