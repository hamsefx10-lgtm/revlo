const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Baraka', mode: 'insensitive' } },
        { email: { contains: 'Baraka', mode: 'insensitive' } }
      ]
    }
  });
  fs.writeFileSync('/tmp/baraka_user_result.json', JSON.stringify(users, null, 2));
  console.log('FOUND ' + users.length + ' USERS');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
