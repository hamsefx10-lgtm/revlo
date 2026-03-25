const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ids = ['0bc9059c-54ab-4c42-9a9d-7808787dd8ac', '7a106acd-7659-4d8f-8289-3f3e683e89a0'];
  for (const id of ids) {
    const vendor = await prisma.shopVendor.findUnique({
      where: { id },
      include: {
        expenses: true,
        transactions: true
      }
    });

    if (!vendor) continue;

    console.log(`--- VENDOR: ${vendor.name} (${id}) ---`);
    const totalExp = vendor.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const totalPaid = vendor.transactions.filter(t => t.type === 'DEBT_REPAID' || t.type === 'EXPENSE').reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    console.log(`  EXPENSES: ${vendor.expenses.length} | TOTAL: ${totalExp}`);
    console.log(`  TRANSACTIONS: ${vendor.transactions.length} | PAID: ${totalPaid}`);
    console.log(`  REMAINING: ${totalExp - totalPaid}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
