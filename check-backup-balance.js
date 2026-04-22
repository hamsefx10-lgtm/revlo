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
      ],
      createdAt: {
        lte: new Date('2026-03-19T23:59:59.000Z')
      }
    },
    orderBy: { createdAt: 'asc' }
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

  console.log(`Calculated Balance up to 2026-03-19 based on createdAt: ${balance}`);
  console.log(`Backup Balance on 2026-03-19: -2554.6699999999255`);
  console.log(`Difference: ${balance - (-2554.6699999999255)}`);
}
main().finally(() => prisma.$disconnect());
