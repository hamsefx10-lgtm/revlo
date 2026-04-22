const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'birshil1@gmail.com' },
    include: {
      company: true
    }
  });
  console.log("USER:", user);
  
  const superAdmin = await prisma.user.findFirst({
    where: { email: { contains: 'hamse' } }
  });
  console.log("SUPERADMIN:", superAdmin);
  
  await prisma.$disconnect();
}

checkUser();
