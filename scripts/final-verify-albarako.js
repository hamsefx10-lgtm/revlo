const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const alBarakoId = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac';
  
  const v = await prisma.shopVendor.findUnique({
    where: { id: alBarakoId },
    include: {
      expenses: true,
      transactions: {
        include: {
          account: true
        }
      }
    }
  });

  if (!v) {
    console.log('Vendor not found');
    return;
  }

  const totalExp = v.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalPaid = v.transactions.reduce((s, t) => {
    if (['EXPENSE', 'DEBT_REPAID'].includes(t.type)) return s + Math.abs(Number(t.amount));
    return s;
  }, 0);

  console.log('--- VENDOR SUMMARY: ' + v.name + ' ---');
  console.log('TOTAL_EXPENSES: ' + totalExp);
  console.log('TOTAL_PAID: ' + totalPaid);
  console.log('REMAINING_DEBT: ' + (totalExp - totalPaid));
  
  console.log('\n--- ACCOUNT USAGE (WHERE THE MONEY LEFT FROM) ---');
  const accountUsage = {};
  v.transactions.forEach(t => {
    if (t.account && ['EXPENSE', 'DEBT_REPAID'].includes(t.type)) {
      const name = t.account.name;
      accountUsage[name] = (accountUsage[name] || 0) + Math.abs(Number(t.amount));
    }
  });

  for (const [name, amt] of Object.entries(accountUsage)) {
    console.log(`${name}: Br${amt.toLocaleString()}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
