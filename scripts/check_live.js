const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function x() {
  const E='3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const C='c8306c05-5279-4b05-b5fc-dda41c793a77';
  const a=await p.account.findUnique({where:{id:E}});
  const b=await p.account.findUnique({where:{id:C}});
  console.log('E-Birr:', a.balance);
  console.log('CBE:', b.balance);
}
x().finally(()=>p.$disconnect());
