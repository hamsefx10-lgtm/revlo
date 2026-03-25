const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v1 = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny
  const v2 = '0bc9059c-54ab-4c42-9a9d-7808787dd8ac'; // Al-Barako
  
  // 1. Move the specific large expenses from Al-Barako to Barako compeny
  const specificExps = [
    'c99ca820-1c7d-4b88-9128-ffd8c3b31ea5', // PO-2026-003 (100k)
    '2fdd07a8-b2df-4507-a089-7bfa3404b6fb', // PO-2026-002 (72.5k)
    '45a630e5-23ea-4a12-86e3-0735c68c9cee'  // Xafiiska Cusub (54.7k)
  ];

  for (const id of specificExps) {
    console.log(`Moving Expense ${id} to Barako compeny...`);
    await prisma.expense.update({
      where: { id },
      data: { vendorId: v1 }
    });
  }

  // 2. Fix the remaining small debt ($850) by moving its expense (or just ignore if it's correct)
  // Actually, let's check one more thing.
  // Transaction 24157907-a0ec-4d98-9978-6ac5a20f2067 is $16,800 standalone?

  console.log('Misassigned expenses moved!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
