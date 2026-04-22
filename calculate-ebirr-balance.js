const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const accountId = '3c156507-ea0a-4974-8a54-92f1e9dd519a';
  const txs = await prisma.transaction.findMany({
    where: {
      OR: [
        { accountId: accountId },
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    },
    orderBy: { transactionDate: 'asc' }
  });

  let balance = 0;
  let runningBalance = [];

  for (const t of txs) {
    const amt = Math.abs(parseFloat(t.amount.toString()));
    let flow = 0;
    
    // Determine if it's inflow or outflow
    if (t.accountId === accountId) {
      if (['INCOME', 'TRANSFER_IN', 'DEBT_RECEIVED', 'SHAREHOLDER_DEPOSIT'].includes(t.type)) {
        flow = amt;
      } else if (['EXPENSE', 'DEBT_TAKEN', 'DEBT_GIVEN', 'TRANSFER_OUT'].includes(t.type)) {
        flow = -amt;
      } else if (t.type === 'DEBT_REPAID') {
        if (t.vendorId) {
          flow = -amt;
        } else {
          flow = amt;
        }
      } else {
        flow = -amt; // default fallback
      }
    } else if (t.toAccountId === accountId) {
      flow = amt;
    } else if (t.fromAccountId === accountId) {
      flow = -amt;
    }

    balance += flow;
    
    runningBalance.push({
      date: t.transactionDate,
      desc: t.description,
      type: t.type,
      amount: amt,
      flow: flow,
      balance: balance
    });
  }

  console.log(`Total transactions processed: ${runningBalance.length}`);
  console.log(`Final Calculated Balance: ${balance}`);
  
  const acc = await prisma.account.findUnique({ where: { id: accountId } });
  console.log(`Current DB Balance: ${acc.balance}`);

  console.log('\n--- Balances around April 18-20 ---');
  runningBalance.filter(r => new Date(r.date).getMonth() === 3 && new Date(r.date).getFullYear() === 2026 && new Date(r.date).getDate() >= 17).forEach(r => {
    console.log(`[${new Date(r.date).toISOString().split('T')[0]}] [${r.type}] Flow: ${r.flow}, Balance: ${r.balance}, Desc: ${r.desc}`);
  });
}
main().finally(() => prisma.$disconnect());
