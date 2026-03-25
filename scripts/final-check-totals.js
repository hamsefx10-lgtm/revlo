const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac';
  const v = await prisma.shopVendor.findUnique({
    where: { id },
    include: { expenses: true, transactions: true }
  });
  
  if (!v) {
    console.log('Vendor not found');
    return;
  }

  const te = v.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const tp = v.transactions.reduce((s, t) => {
    if (['EXPENSE', 'DEBT_REPAID'].includes(t.type)) return s + Math.abs(Number(t.amount));
    return s;
  }, 0);
  
  console.log(`EXP:${te}|PAID:${tp}|REM:${te - tp}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
