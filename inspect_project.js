const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = '2970784b-8a6f-415e-a0cd-a6d3e1177801';
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      transactions: true,
      customer: { select: { name: true } }
    }
  });

  if (!project) {
    console.log('Project not found');
    return;
  }

  console.log('--- Project Details ---');
  console.log('Name:', project.name);
  console.log('Agreement Amount:', project.agreementAmount.toString());
  console.log('Advance Paid:', project.advancePaid.toString());
  console.log('Start Date:', project.startDate);
  console.log('Expected Completion:', project.expectedCompletionDate);
  console.log('Transactions Count:', project.transactions.length);
  
  project.transactions.forEach(t => {
    console.log(`  - Type: ${t.type}, Amount: ${t.amount}, AccountId: ${t.accountId}, Desc: ${t.description}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
