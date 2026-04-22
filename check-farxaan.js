const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const u = await prisma.user.findUnique({ where: { email: 'farxaanmaxamad503@gmail.com' } });
  console.log(u);
}
main().finally(() => prisma.$disconnect());
