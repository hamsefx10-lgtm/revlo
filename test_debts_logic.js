const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runDebtsReportLogic() {
  const companyId = '081fb675-b41e-4cea-92f7-50a5eb3e6f1e'; // birshil's company

  try {
    console.log("Running Debts Reports logic...");
    // 1. Transactions
    const allTransactions = await prisma.transaction.findMany({
      where: {
        companyId,
        OR: [
          { type: 'DEBT_TAKEN' },
          { type: 'DEBT_REPAID' },
          { type: 'DEBT_RECEIVED' },
          { type: 'DEBT_GIVEN' }
        ]
      },
      include: {
        vendor: true,
        customer: true,
        account: true,
        project: true,
        company: true,
      },
      orderBy: { transactionDate: 'desc' }
    });
    console.log("Transactions loaded:", allTransactions.length);

    const allProjects = await prisma.project.findMany({
      where: { companyId },
      include: {
        customer: true,
        transactions: {
           // Prisma logic
        }
      }
    });
    console.log("Projects loaded:", allProjects.length);

  } catch (e) {
    console.error("ERROR IN DEBTS logic:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

runDebtsReportLogic();
