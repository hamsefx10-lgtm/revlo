import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { issueIds } = await request.json();

    if (!Array.isArray(issueIds) || issueIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No issue IDs provided' },
        { status: 400 }
      );
    }

    let totalFixed = 0;
    const results: any[] = [];

    for (const issueId of issueIds) {
      try {
        let result = { success: false, message: '', affectedRecords: 0 };

        switch (issueId) {
          case 'orphaned-transactions':
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
              const ids = group.ids.slice(1);
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
                companyId,
                customer: { is: null }
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

        results.push({ issueId, ...result });
        if (result.success) {
          totalFixed += result.affectedRecords;
        }

      } catch (error: any) {
        results.push({
          issueId,
          success: false,
          message: `Error fixing ${issueId}: ${error.message}`,
          affectedRecords: 0
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk fix completed. Fixed ${totalFixed} records across ${results.filter(r => r.success).length} issues.`,
      totalFixed,
      results
    });

  } catch (error: any) {
    console.error('Error in bulk fix:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to perform bulk fix', 
        error: error.message,
        totalFixed: 0
      },
      { status: 500 }
    );
  }
}

