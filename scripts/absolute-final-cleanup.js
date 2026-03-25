const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alBarakoId = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac';
  
  // 1. Delete standalone duplicate $16,800
  try {
    await prisma.transaction.delete({
      where: { id: '24157907-a0ec-4d98-9978-6ac5a20f2067' }
    });
    console.log('Deleted duplicate $16,800');
  } catch (e) {
    console.log('Duplicate $16,800 already gone or not found');
  }

  // 2. Delete duplicate $15,950 payments
  const payments15950 = await prisma.transaction.findMany({
    where: {
      amount: -15950,
      vendorId: alBarakoId
    }
  });

  if (payments15950.length > 1) {
    console.log(`Found ${payments15950.length} payments of $15,950 for Al-Barako. Deleting duplicates...`);
    for (let i = 1; i < payments15950.length; i++) {
      await prisma.transaction.delete({ where: { id: payments15950[i].id } });
    }
  }

  // 3. Last check for Al-Barako to be 0
  const v = await prisma.shopVendor.findUnique({
    where: { id: alBarakoId },
    include: { expenses: true, transactions: true }
  });

  const te = v.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const tp = v.transactions.reduce((s, t) => {
    if (['EXPENSE', 'DEBT_REPAID'].includes(t.type)) return s + Math.abs(Number(t.amount));
    return s;
  }, 0);

  console.log(`AL-BARAKO FINAL: EXP:${te} | PAID:${tp} | REM:${te - tp}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
