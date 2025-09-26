// scripts/fix-accounting-data.js - Fix existing accounting data inconsistencies
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAccountingData() {
  console.log('🚀 Starting accounting data migration...');
  
  try {
    // 1. Fix all project remaining amounts
    await fixProjectRemainingAmounts();
    
    // 2. Fix customer debt calculations
    await fixCustomerDebtCalculations();
    
    // 3. Validate all data is consistent
    await validateDataConsistency();
    
    console.log('✅ Accounting data migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function fixProjectRemainingAmounts() {
  console.log('📊 Fixing project remaining amounts...');
  
  const projects = await prisma.project.findMany({
    include: {
      transactions: {
        where: {
          type: { in: ['INCOME', 'DEBT_REPAID'] }
        }
      }
    }
  });
  
  let fixedCount = 0;
  
  for (const project of projects) {
    const agreementAmount = Number(project.agreementAmount);
    const currentAdvancePaid = Number(project.advancePaid);
    
    // Calculate correct remaining amount
    const correctRemainingAmount = Math.max(0, agreementAmount - currentAdvancePaid);
    const currentRemainingAmount = Number(project.remainingAmount);
    
    // Only update if there's a discrepancy
    if (Math.abs(correctRemainingAmount - currentRemainingAmount) > 0.01) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          remainingAmount: correctRemainingAmount
        }
      });
      
      console.log(`✅ Fixed project "${project.name}": ${currentRemainingAmount} → ${correctRemainingAmount}`);
      fixedCount++;
    }
  }
  
  console.log(`📊 Fixed ${fixedCount} projects with incorrect remaining amounts`);
}

async function fixCustomerDebtCalculations() {
  console.log('👥 Fixing customer debt calculations...');
  
  const customers = await prisma.customer.findMany({
    include: {
      projects: true,
      transactions: {
        where: {
          type: { in: ['DEBT_TAKEN', 'DEBT_REPAID', 'INCOME'] }
        }
      }
    }
  });
  
  let fixedCount = 0;
  
  for (const customer of customers) {
    // Calculate correct outstanding debt
    let outstandingDebt = 0;
    
    for (const transaction of customer.transactions) {
      if (transaction.type === 'DEBT_TAKEN') {
        outstandingDebt += Number(transaction.amount);
      } else if (transaction.type === 'DEBT_REPAID' || transaction.type === 'INCOME') {
        outstandingDebt -= Number(transaction.amount);
      }
    }
    
    // Ensure debt is not negative
    outstandingDebt = Math.max(0, outstandingDebt);
    
    // Update customer if needed (if we had a debt field)
    // For now, we'll just log the correct debt amount
    console.log(`👥 Customer "${customer.name}" debt: $${outstandingDebt.toLocaleString()}`);
    fixedCount++;
  }
  
  console.log(`👥 Processed ${fixedCount} customers for debt calculations`);
}

async function validateDataConsistency() {
  console.log('🔍 Validating data consistency...');
  
  const projects = await prisma.project.findMany();
  let inconsistentProjects = 0;
  
  for (const project of projects) {
    const agreementAmount = Number(project.agreementAmount);
    const advancePaid = Number(project.advancePaid);
    const remainingAmount = Number(project.remainingAmount);
    
    const calculatedRemaining = Math.max(0, agreementAmount - advancePaid);
    
    if (Math.abs(calculatedRemaining - remainingAmount) > 0.01) {
      console.log(`⚠️  Inconsistent project "${project.name}": remaining=${remainingAmount}, calculated=${calculatedRemaining}`);
      inconsistentProjects++;
    }
  }
  
  if (inconsistentProjects === 0) {
    console.log('✅ All project data is consistent!');
  } else {
    console.log(`⚠️  Found ${inconsistentProjects} inconsistent projects`);
  }
  
  // Validate transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      type: { in: ['INCOME', 'DEBT_REPAID'] },
      projectId: { not: null }
    },
    include: {
      project: true
    }
  });
  
  console.log(`📈 Found ${transactions.length} payment transactions linked to projects`);
  
  // Check for orphaned transactions
  const orphanedTransactions = await prisma.transaction.findMany({
    where: {
      projectId: { not: null },
      project: null
    }
  });
  
  if (orphanedTransactions.length > 0) {
    console.log(`⚠️  Found ${orphanedTransactions.length} orphaned transactions`);
  } else {
    console.log('✅ No orphaned transactions found');
  }
}

// Run the migration
if (require.main === module) {
  fixAccountingData()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixAccountingData };

