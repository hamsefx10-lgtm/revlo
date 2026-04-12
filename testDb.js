const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function run() {
  const assets = await prisma.fixedAsset.findMany({ orderBy: { id: "desc" }, take: 5 });
  console.log("Recent Fixed Assets:", assets);
  
  const txs = await prisma.transaction.findMany({ 
    where: { category: "FIXED_ASSET_PURCHASE" }, 
    orderBy: { id: "desc" }, 
    take: 5 
  });
  console.log("Recent TXs:", txs);
}
run().catch(console.error).finally(() => prisma.$disconnect());
