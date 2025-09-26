import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function POST(
  request: Request,
  { params }: { params: { issueId: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const { issueId } = params;

    let result = { success: false, message: '', affectedRecords: 0 };

    switch (issueId) {
      case 'orphaned-transactions':
        // Delete orphaned transactions
        const deletedOrphaned = await prisma.transaction.deleteMany({
          where: {
            companyId,
            OR: [
              { projectId: { not: null }, project: { is: null } },
              { customerId: { not: null }, customer: { is: null } }
            ]
          }
        });
        result = {
          success: true,
          message: `Deleted ${deletedOrphaned.count} orphaned transactions`,
          affectedRecords: deletedOrphaned.count
        };
        break;

      case 'negative-remaining-amounts':
        // Fix negative remaining amounts by setting them to 0
        const fixedProjects = await prisma.project.updateMany({
          where: {
            companyId,
            remainingAmount: { lt: 0 }
          },
          data: {
            remainingAmount: 0
          }
        });
        result = {
          success: true,
          message: `Fixed ${fixedProjects.count} projects with negative remaining amounts`,
          affectedRecords: fixedProjects.count
        };
        break;

      case 'duplicate-transactions':
        // Remove duplicate transactions (keep the first one)
        const duplicateGroups = await prisma.$queryRaw`
          SELECT 
            "description", 
            "amount", 
            "transactionDate", 
            "type",
            array_agg("id" ORDER BY "createdAt") as ids
          FROM "Transaction" 
          WHERE "companyId" = ${companyId}
          GROUP BY "description", "amount", "transactionDate", "type"
          HAVING COUNT(*) > 1
        `;

        let totalDeleted = 0;
        for (const group of duplicateGroups as any[]) {
          const ids = group.ids.slice(1); // Keep first, delete rest
          if (ids.length > 0) {
            const deleted = await prisma.transaction.deleteMany({
              where: { id: { in: ids } }
            });
            totalDeleted += deleted.count;
          }
        }

        result = {
          success: true,
          message: `Removed ${totalDeleted} duplicate transactions`,
          affectedRecords: totalDeleted
        };
        break;

      case 'projects-without-customers':
        // Try to link projects to customers based on project name or create a default customer
        const defaultCustomer = await prisma.customer.findFirst({
          where: { companyId, name: { contains: 'Default' } }
        });

        let customerId = defaultCustomer?.id;
        if (!customerId) {
          const newCustomer = await prisma.customer.create({
            data: {
              name: 'Default Customer',
              email: 'default@company.com',
              phone: '000-000-0000',
              companyId
            }
          });
          customerId = newCustomer.id;
        }

        const linkedProjects = await prisma.project.updateMany({
          where: {
            companyId
          },
          data: { customerId }
        });

        result = {
          success: true,
          message: `Linked ${linkedProjects.count} projects to default customer`,
          affectedRecords: linkedProjects.count
        };
        break;

      case 'expenses-without-categories':
        // Set default categories for expenses without categories
        const updatedExpenses = await prisma.expense.updateMany({
          where: {
            companyId,
            OR: [
              { category: '' },
              { subCategory: '' }
            ]
          },
          data: {
            category: 'Other',
            subCategory: 'General'
          }
        });

        result = {
          success: true,
          message: `Updated ${updatedExpenses.count} expenses with default categories`,
          affectedRecords: updatedExpenses.count
        };
        break;

      case 'inconsistent-project-amounts':
        // Fix projects with invalid amounts
        const fixedAmounts = await prisma.project.updateMany({
          where: {
            companyId,
            OR: [
              { agreementAmount: { lte: 0 } },
              { advancePaid: { lt: 0 } }
            ]
          },
          data: {
            agreementAmount: 0,
            advancePaid: 0,
            remainingAmount: 0
          }
        });

        result = {
          success: true,
          message: `Fixed ${fixedAmounts.count} projects with inconsistent amounts`,
          affectedRecords: fixedAmounts.count
        };
        break;

      case 'transactions-without-descriptions':
        // Add default descriptions for transactions without descriptions
        const updatedTransactions = await prisma.transaction.updateMany({
          where: {
            companyId,
            OR: [
              { description: '' }
            ]
          },
          data: {
            description: 'Transaction (description added by system)'
          }
        });

        result = {
          success: true,
          message: `Updated ${updatedTransactions.count} transactions with default descriptions`,
          affectedRecords: updatedTransactions.count
        };
        break;

      default:
        result = {
          success: false,
          message: 'Unknown issue type',
          affectedRecords: 0
        };
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Error fixing data issue:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fix data issue', 
        error: error.message,
        affectedRecords: 0
      },
      { status: 500 }
    );
  }
}

