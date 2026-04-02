const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const CBE = 'c8306c05-5279-4b05-b5fc-dda41c793a77';
  const txs = await p.transaction.findMany({ where: { accountId: CBE } });
  
  let inc = 0, exp = 0;
  for(let t of txs) {
    const amt = Number(t.amount);
    if(['INCOME','TRANSFER_IN','DEBT_RECEIVED','SHAREHOLDER_DEPOSIT'].includes(t.type) || (t.type==='DEBT_REPAID' && !t.vendorId && !t.expenseId)) inc += amt;
    else exp += amt;
  }
  console.log('CBE RAW:', { In: inc, Out: exp, Net: inc - exp });
  
  const EBIRR = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const bx = await p.transaction.findMany({ where: { accountId: EBIRR } });
  
  let bi = 0, be = 0;
  let falseIncomes = [];
  for(let t of bx) {
    const amt = Number(t.amount);
    // Is E-Birr recording an expense as income? 
    if(['INCOME','TRANSFER_IN','DEBT_RECEIVED','SHAREHOLDER_DEPOSIT'].includes(t.type) || (t.type==='DEBT_REPAID' && !t.vendorId && !t.expenseId)) {
        bi += amt;
    } else {
        be += amt;
        // if user feels money left E-birr but it shows as extra balance, maybe logic swapped it? No, balance adds it.
    }
  }
  console.log('EBIRR RAW:', { In: bi, Out: be, Net: bi - be });
}

run()
  .catch(console.error)
  .finally(() => p.$disconnect());
