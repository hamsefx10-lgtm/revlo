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

  for (const t of txs) {
    const amt = Math.abs(parseFloat(t.amount.toString()));
    let flow = 0;
    
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
        flow = -amt;
      }
    } else if (t.toAccountId === accountId) {
      flow = amt;
    } else if (t.fromAccountId === accountId) {
      flow = -amt;
    }

    balance += flow;
  }

  const acc = await prisma.account.findUnique({ where: { id: accountId } });
  console.log(`True Calculated Balance: ${balance}`);
  console.log(`Current DB Balance: ${acc.balance}`);
  console.log(`Difference (Calculated - DB): ${balance - acc.balance}`);
}
main().finally(() => prisma.$disconnect());
