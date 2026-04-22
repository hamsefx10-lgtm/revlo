const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runReportLogic() {
  const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // birshil's company

  try {
    console.log("Running Reports logic...");
    const totalBalanceResult = await prisma.account.aggregate({
      _sum: { balance: true },
      where: { companyId },
    });
    
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    console.log("Fetching projects...");
    const monthlyProjectsAdvanceResult = await prisma.project.aggregate({
      _sum: { advancePaid: true },
      where: {
        companyId,
        createdAt: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    console.log("Fetching transactions...");
    const allTransactions = await prisma.transaction.findMany({
      where: { companyId }
    });
    
    console.log(`Found ${allTransactions.length} transactions`);
    
    // Testing the loop execution
    let totalIncome = 0;
    allTransactions.forEach(trx => {
      const amount = Math.abs(typeof trx.amount.toNumber === 'function' ? trx.amount.toNumber() : Number(trx.amount));
      const description = trx.description || '';
      const isAutoAdvance = description.toLowerCase().includes('advance payment');
      if (trx.type === 'INCOME' && !isAutoAdvance) {
        totalIncome += amount;
      }
    });
    
    console.log("Stats complete");

  } catch (e) {
    console.error("ERROR IN REPORTS LOGIC:", e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

runReportLogic();
