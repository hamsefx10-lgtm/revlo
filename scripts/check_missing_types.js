const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function check() {
  const share = await p.transaction.count({ where: { type: 'SHAREHOLDER_DEPOSIT' } });
  const sal = await p.transaction.count({ where: { type: 'SALARY' } });
  
  const txs = await p.transaction.findMany({ 
    where: { OR: [ {type: 'SHAREHOLDER_DEPOSIT'}, {type: 'SALARY'} ] },
    select: { type: true, amount: true, description: true }
  });
  console.log('SHARE:', share, 'SALARY:', sal);
  console.log(txs);
}
check().finally(()=>p.$disconnect());
