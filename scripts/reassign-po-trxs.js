const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v1 = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  const trxs = await prisma.transaction.findMany({
    where: { OR: [{ amount: 100000 }, { amount: -100000 }, { amount: 72500 }, { amount: -72500 }] }
  });

  console.log(`Found ${trxs.length} PO related transactions.`);
  for (const t of trxs) {
    console.log(`Updating TRX ${t.id} (Amt: ${t.amount}) to Barako compeny...`);
    await prisma.transaction.update({
      where: { id: t.id },
      data: { vendorId: v1 }
    });
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
