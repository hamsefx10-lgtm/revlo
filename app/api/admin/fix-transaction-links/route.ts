// app/api/admin/fix-transaction-links/route.ts - Fix transaction-project links
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const sessionData = await getSessionCompanyUser();
    if (!sessionData) {
      return NextResponse.json({ message: 'Awood uma lihid.' }, { status: 401 });
    }
    const { companyId } = sessionData;
    
    console.log('🔧 Starting transaction-project link fix...');
    
    // Get all INCOME transactions without project links
    const incomeWithoutProject = await prisma.transaction.findMany({
      where: {
        companyId,
        type: 'INCOME',
        projectId: { equals: null }
      },
      include: {
        customer: { select: { id: true, name: true } }
      }
    });

    console.log(`Found ${incomeWithoutProject.length} INCOME transactions without project links`);

    const fixes = [];
    let fixedCount = 0;

    for (const transaction of incomeWithoutProject) {
      // Try to find a project for this customer
      if (transaction.customerId) {
        const projects = await prisma.project.findMany({
          where: {
            companyId,
            customerId: transaction.customerId
          },
          orderBy: { createdAt: 'desc' }
        });

        if (projects.length > 0) {
          // Link to the most recent project for this customer
          const project = projects[0];
          
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: { projectId: project.id }
          });

          // Update project advance paid amount
          const newAdvancePaid = Number(project.advancePaid) + Number(transaction.amount);
          const newRemainingAmount = Number(project.agreementAmount) - newAdvancePaid;

          await prisma.project.update({
            where: { id: project.id },
            data: {
              advancePaid: newAdvancePaid,
              remainingAmount: Math.max(0, newRemainingAmount)
            }
          });

          fixes.push({
            transactionId: transaction.id,
            transactionDescription: transaction.description,
            projectId: project.id,
            projectName: project.name,
            customerName: transaction.customer?.name,
            amount: transaction.amount
          });

          fixedCount++;
          console.log(`✅ Linked transaction "${transaction.description}" to project "${project.name}"`);
        } else {
          console.log(`⚠️  No projects found for customer: ${transaction.customer?.name}`);
        }
      } else {
        console.log(`⚠️  Transaction "${transaction.description}" has no customer link`);
      }
    }

    // Validate the fixes
    const validationResults = [];
    for (const fix of fixes) {
      const updatedTransaction = await prisma.transaction.findUnique({
        where: { id: fix.transactionId },
        include: {
          project: { select: { name: true } }
        }
      });

      const updatedProject = await prisma.project.findUnique({
        where: { id: fix.projectId }
      });

      validationResults.push({
        transactionId: fix.transactionId,
        transactionDescription: fix.transactionDescription,
        projectLinked: !!updatedTransaction?.projectId,
        projectName: updatedTransaction?.project?.name,
        projectAdvancePaid: updatedProject?.advancePaid,
        projectRemainingAmount: updatedProject?.remainingAmount
      });
    }

    return NextResponse.json({
      message: `Successfully fixed ${fixedCount} transaction-project links`,
      summary: {
        totalIncomeWithoutProject: incomeWithoutProject.length,
        fixedCount,
        remainingUnlinked: incomeWithoutProject.length - fixedCount
      },
      fixes,
      validation: validationResults
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error fixing transaction links:', error);
    return NextResponse.json(
      { message: 'Cilad ayaa dhacday marka transaction links la saxayay.' },
      { status: 500 }
    );
  }
}
