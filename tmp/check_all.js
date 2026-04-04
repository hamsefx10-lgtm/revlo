const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function run() {
  const gte = new Date('2026-03-19T00:00:00Z');
  const lt = new Date('2026-03-20T00:00:00Z');
  const txs = await prisma.transaction.findMany({ where: { transactionDate: { gte, lt } } });
  const outTx = txs.filter(t => ['EXPENSE','DEBT_GIVEN','DEBT_TAKEN','TRANSFER_OUT'].includes(t.type));
  // Write to a file instead
  const lines = outTx.map(t => `${t.id} | ${t.type} | ${t.amount} | ${t.description}`);
  fs.writeFileSync('tmp/out_txs.txt', lines.join('\n'));
}
run().then(() => prisma.$disconnect());
