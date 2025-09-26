// scripts/check-transactions.js - Check existing transactions and their project links
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTransactions() {
  console.log('🔍 Checking existing transactions...');
  
  try {
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      include: {
        project: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        account: { select: { name: true } }
      },
      orderBy: { transactionDate: 'desc' },
      take: 20 // Get last 20 transactions
    });

    console.log(`\n📊 Found ${transactions.length} transactions:`);
    
    transactions.forEach((trx, index) => {
      console.log(`\n${index + 1}. Transaction ID: ${trx.id}`);
      console.log(`   Description: ${trx.description}`);
      console.log(`   Amount: $${trx.amount}`);
      console.log(`   Type: ${trx.type}`);
      console.log(`   Date: ${trx.transactionDate.toISOString().split('T')[0]}`);
      console.log(`   Account: ${trx.account?.name || 'N/A'}`);
      console.log(`   Project: ${trx.project ? `${trx.project.name} (${trx.project.id})` : '❌ NO PROJECT LINKED'}`);
      console.log(`   Customer: ${trx.customer ? `${trx.customer.name} (${trx.customer.id})` : '❌ NO CUSTOMER LINKED'}`);
      
      if (trx.type === 'INCOME' && !trx.projectId) {
        console.log(`   ⚠️  WARNING: INCOME transaction without project link!`);
      }
    });

    // Check for INCOME transactions without project links
    const incomeWithoutProject = await prisma.transaction.findMany({
      where: {
        type: 'INCOME',
        projectId: null
      },
      include: {
        customer: { select: { name: true } },
        account: { select: { name: true } }
      }
    });

    console.log(`\n🚨 Found ${incomeWithoutProject.length} INCOME transactions without project links:`);
    incomeWithoutProject.forEach((trx, index) => {
      console.log(`   ${index + 1}. ${trx.description} - $${trx.amount} - ${trx.customer?.name || 'No customer'}`);
    });

    // Check projects and their transactions
    const projects = await prisma.project.findMany({
      include: {
        transactions: {
          where: { type: 'INCOME' },
          select: { id: true, description: true, amount: true, transactionDate: true }
        },
        customer: { select: { name: true } }
      }
    });

    console.log(`\n📋 Projects and their INCOME transactions:`);
    projects.forEach((project, index) => {
      console.log(`\n${index + 1}. Project: ${project.name} (${project.id})`);
      console.log(`   Customer: ${project.customer.name}`);
      console.log(`   Agreement: $${project.agreementAmount}`);
      console.log(`   Advance Paid: $${project.advancePaid}`);
      console.log(`   Remaining: $${project.remainingAmount}`);
      console.log(`   INCOME Transactions: ${project.transactions.length}`);
      
      project.transactions.forEach((trx, trxIndex) => {
        console.log(`     ${trxIndex + 1}. ${trx.description} - $${trx.amount} - ${trx.transactionDate.toISOString().split('T')[0]}`);
      });
    });

  } catch (error) {
    console.error('❌ Error checking transactions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
