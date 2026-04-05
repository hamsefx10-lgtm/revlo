import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const txs = await prisma.transaction.findMany({
    where: { description: { contains: 'phase two kasoo xarootay' } }
  });
  fs.writeFileSync('c:\\Users\\OMEN\\projects\\revlo-vr\\tmp\\tx_output.json', JSON.stringify(txs, null, 2));
}

main().finally(() => prisma.$disconnect());
