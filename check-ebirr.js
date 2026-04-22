const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e';
  const accounts = await prisma.account.findMany({
    where: { 
      companyId: companyId
    }
  });
  console.log('Accounts:', JSON.stringify(accounts, null, 2));
}
main().finally(() => prisma.$disconnect());
