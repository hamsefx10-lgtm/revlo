const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.transaction.count();
    console.log('Total transactions in DB:', count);
    
    // Also fetch one transaction to see the shape
    const trx = await prisma.transaction.findFirst();
    console.log('First transaction:', trx);
  } catch (e) {
    console.error('DB Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
