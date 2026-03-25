const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reconcile() {
  const masterExpId = 'cbd21fe7-d18c-42fa-a035-9dbd36a908aa';
  const trx300Id = '1ed2fbd8-b726-499c-a2aa-b09e426b2503';
  const trx800Id = '2c7c58c0-2427-47f3-95fb-0fba1ccccd82';
  const targetVendorId = '7a106acd-7659-4d8f-8289-3f3e683e89a0'; // Barako compeny

  console.log('Starting reconciliation...');

  // 1. Move 800k trx to correct vendor
  await prisma.transaction.update({
    where: { id: trx800Id },
    data: { vendorId: targetVendorId }
  });
  console.log('Moved 800k transaction to Barako compeny.');

  // 2. Link 300k trx to expense
  await prisma.transaction.update({
    where: { id: trx300Id },
    data: { expenseId: masterExpId }
  });
  console.log('Linked 300k payment to master expense.');

  // 3. Link 800k trx to expense
  await prisma.transaction.update({
    where: { id: trx800Id },
    data: { expenseId: masterExpId }
  });
  console.log('Linked 800k payment to master expense.');

  // 4. Update expense status to PARTIAL
  await prisma.expense.update({
    where: { id: masterExpId },
    data: { paymentStatus: 'PARTIAL' }
  });
  console.log('Set expense status to PARTIAL.');

  console.log('Reconciliation complete!');
}

reconcile()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
