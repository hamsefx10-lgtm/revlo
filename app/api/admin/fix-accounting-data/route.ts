// app/api/admin/fix-accounting-data/route.ts - Live fix for accounting data inconsistencies
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    
    console.log('🚀 Starting live accounting data fix...');
    
    // 1. Fix all project remaining amounts for this company
    const projects = await prisma.project.findMany({
      where: { companyId },
      include: {
        transactions: {
          where: {
            type: { in: ['INCOME', 'DEBT_REPAID'] }
          }
        }
      }
    });
    
    let fixedProjects = 0;
    const projectFixes = [];
    
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
        
        projectFixes.push({
          projectId: project.id,
          projectName: project.name,
          oldRemaining: currentRemainingAmount,
          newRemaining: correctRemainingAmount
        });
        
        fixedProjects++;
      }
    }
    
    // 2. Fix customer debt calculations
    const customers = await prisma.customer.findMany({
      where: { companyId },
      include: {
        projects: true,
        transactions: {
          where: {
            type: { in: ['DEBT_TAKEN', 'DEBT_REPAID', 'INCOME'] }
          }
        }
      }
    });
    
    let processedCustomers = 0;
    const customerDebts = [];
    
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
      
      customerDebts.push({
        customerId: customer.id,
        customerName: customer.name,
        calculatedDebt: outstandingDebt
      });
      
      processedCustomers++;
    }
    
    // 3. Validate data consistency
    const validationResults = await validateDataConsistency(companyId);
    
    return NextResponse.json({
      message: 'Accounting data fixed successfully!',
      results: {
        fixedProjects,
        processedCustomers,
        projectFixes,
        customerDebts,
        validation: validationResults
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fixing accounting data:', error);
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka xogta la saxayay.' },
      { status: 500 }
    );
  }
}

async function validateDataConsistency(companyId: string) {
  const projects = await prisma.project.findMany({
    where: { companyId }
  });
  
  let inconsistentProjects = 0;
  const inconsistencies = [];
  
  for (const project of projects) {
    const agreementAmount = Number(project.agreementAmount);
    const advancePaid = Number(project.advancePaid);
    const remainingAmount = Number(project.remainingAmount);
    
    const calculatedRemaining = Math.max(0, agreementAmount - advancePaid);
    
    if (Math.abs(calculatedRemaining - remainingAmount) > 0.01) {
      inconsistencies.push({
        projectId: project.id,
        projectName: project.name,
        currentRemaining: remainingAmount,
        calculatedRemaining: calculatedRemaining
      });
      inconsistentProjects++;
    }
  }
  
  return {
    totalProjects: projects.length,
    inconsistentProjects,
    inconsistencies,
    isConsistent: inconsistentProjects === 0
  };
}

