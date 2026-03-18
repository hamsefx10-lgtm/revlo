const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = '2970784b-8a6f-415e-a0cd-a6d3e1177801';
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      transactions: true,
      expenses: true,
      laborRecords: true
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('--- Project Overview ---');
  console.log('Name:', project.name);
  console.log('Agreement Amount:', project.agreementAmount.toString());
  console.log('Advance Paid (Static):', project.advancePaid.toString());
  console.log('--- Transactions ---');
  project.transactions.forEach(t => {
    console.log(`[${t.type}] Amount: ${t.amount}, Account: ${t.accountId}, Date: ${t.transactionDate.toISOString()}, Desc: ${t.description}`);
  });
  console.log('--- Expenses ---');
  project.expenses.forEach(e => {
    console.log(`- Amount: ${e.amount}, Category: ${e.category}, Date: ${e.expenseDate.toISOString()}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
