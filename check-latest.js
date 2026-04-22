const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { companyId: '081fb675-b41e-4cea-92f7-50a5eb3e6f1e' },
    select: { email: true, createdAt: true, role: true }
  });
  console.log(users);
}
main().finally(() => prisma.$disconnect());
