const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const gte = new Date('2026-03-19T00:00:00.000Z');
  const lt = new Date('2026-03-20T00:00:00.000Z');
  
  const txs = await prisma.transaction.findMany({
    where: { 
      transactionDate: { gte, lt }
    }
  });

  const exps = await prisma.expense.findMany({
    where: { 
      expenseDate: { gte, lt }
    }
  });

  const missingTxs = txs;
  const missingExps = exps;

  const totalTxOut = txs.filter(t => t.type !== 'INCOME' && t.type !== 'DEBT_RECEIVED' && t.type !== 'TRANSFER_IN').reduce((sum, t) => sum + Number(t.amount), 0);
  console.log('Total TX Outflows:', totalTxOut);
  
  console.log('ALL TX SUMMARY:', txs.map(t => `${t.id} | ${t.type} | ${t.category} | ${t.amount} | ${t.description}`));
  console.log('ALL EXP SUMMARY:', exps.map(e => `${e.id} | ${e.category} | ${e.subCategory} | ${e.amount} | ${e.description}`));
}

run().then(() => prisma.$disconnect()).catch(console.error);
