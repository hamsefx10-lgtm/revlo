
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany({
    take: 100,
    orderBy: { expenseDate: 'desc' }
  });
  console.log(JSON.stringify(expenses, null, 2));
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
