const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v1 = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  const v2 = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac'; // Al-Barako
  
  const v = await prisma.shopVendor.findUnique({
    where: { id: v2 },
    include: {
      expenses: {
        include: { transactions: true }
      },
      transactions: true
    }
  });

  console.log('--- UNPAID EXPENSES (AL-BARAKO) ---');
  v.expenses.forEach(e => {
    const paid = e.transactions.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    if (paid < Number(e.amount)) {
      console.log(`EXP: ${e.id} | Amt: ${e.amount} | Paid: ${paid} | REM: ${Number(e.amount) - paid} | Desc: ${e.description}`);
    }
  });

  console.log('\n--- STANDALONE PAYMENTS (AL-BARAKO) ---');
  v.transactions.forEach(t => {
    if (!t.expenseId && (t.type === 'DEBT_REPAID' || t.type === 'EXPENSE')) {
      console.log(`TRX: ${t.id} | Amt: ${t.amount} | Type: ${t.type} | Desc: ${t.description}`);
    }
  });

  console.log('\n--- PAYMENTS MIXED IN (FROM BARAKO COMPENY TO ALBARAKO EXPENSES) ---');
  const crossTrxs = await prisma.transaction.findMany({
    where: { vendorId: v1, NOT: { expenseId: null } },
    include: { expense: true }
  });
  crossTrxs.forEach(t => {
    if (t.expense && t.expense.vendorId === v2) {
      console.log(`TRX: ${t.id} (Barako Comp) | Amt: ${t.amount} | Linked to Al-Barako Exp: ${t.expenseId} (${t.expense.amount})`);
    }
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
