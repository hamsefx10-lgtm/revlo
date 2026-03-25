const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alBarakoId = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac';
  
  const expenses = await prisma.expense.findMany({
    where: { vendorId: alBarakoId },
    include: { transactions: true }
  });
  
  console.log('--- EXPENSES ---');
  expenses.forEach(e => {
    const paidSum = e.transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    console.log(`EXP: ${e.id} | Amt: ${e.amount} | Status: ${e.paymentStatus} | CalcPaid: ${paidSum} | Desc: ${e.description}`);
    e.transactions.forEach(t => {
      console.log(`  -> TRX: ${t.id} | Amt: ${t.amount} | Type: ${t.type} | Desc: ${t.description}`);
    });
  });

  const standaloneTrxs = await prisma.transaction.findMany({
    where: { vendorId: alBarakoId, expenseId: null }
  });
  console.log('--- STANDALONE TRXS ---');
  standaloneTrxs.forEach(t => {
    console.log(`TRX: ${t.id} | Amt: ${t.amount} | Type: ${t.type} | Desc: ${t.description}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
