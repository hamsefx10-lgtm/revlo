import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    const issues: any[] = [];

    // Check for orphaned transactions (transactions without valid project/customer)
    const orphanedTransactions = await prisma.transaction.findMany({
      where: {
        companyId,
        OR: [
          { projectId: { not: null }, project: null },
          { customerId: { not: null }, customer: null }
        ]
      },
      select: { id: true, type: true, amount: true, description: true }
    });

    if (orphanedTransactions.length > 0) {
      issues.push({
        id: 'orphaned-transactions',
        type: 'Orphaned Transactions',
        description: 'Transactions linked to deleted projects or customers',
        severity: 'high',
        affectedRecords: orphanedTransactions.length,
        status: 'pending',
        createdAt: new Date(),
        details: orphanedTransactions
      });
    }

    // Check for negative remaining amounts
    const negativeRemainingProjects = await prisma.project.findMany({
      where: {
        companyId,
        remainingAmount: { lt: 0 }
      },
      select: { id: true, name: true, remainingAmount: true, agreementAmount: true, advancePaid: true }
    });

    if (negativeRemainingProjects.length > 0) {
      issues.push({
        id: 'negative-remaining-amounts',
        type: 'Negative Remaining Amounts',
        description: 'Projects with negative remaining amounts (overpaid)',
        severity: 'medium',
        affectedRecords: negativeRemainingProjects.length,
        status: 'pending',
        createdAt: new Date(),
        details: negativeRemainingProjects
      });
    }

    // Check for duplicate transactions
    const duplicateTransactions = await prisma.$queryRaw`
      SELECT 
        "description", 
        "amount", 
        "transactionDate", 
        "type",
        COUNT(*) as count
      FROM "Transaction" 
      WHERE "companyId" = ${companyId}
      GROUP BY "description", "amount", "transactionDate", "type"
      HAVING COUNT(*) > 1
    `;

    if (Array.isArray(duplicateTransactions) && duplicateTransactions.length > 0) {
      const totalDuplicates = duplicateTransactions.reduce((sum: number, dup: any) => sum + (dup.count - 1), 0);
      issues.push({
        id: 'duplicate-transactions',
        type: 'Duplicate Transactions',
        description: 'Multiple transactions with identical details',
        severity: 'medium',
        affectedRecords: totalDuplicates,
        status: 'pending',
        createdAt: new Date(),
        details: duplicateTransactions
      });
    }


    // Check for expenses without categories
    const expensesWithoutCategories = await prisma.expense.findMany({
      where: {
        companyId,
        OR: [
          { category: '' },
          { subCategory: '' }
        ]
      },
      select: { id: true, description: true, amount: true, category: true, subCategory: true }
    });

    if (expensesWithoutCategories.length > 0) {
      issues.push({
        id: 'expenses-without-categories',
        type: 'Expenses Without Categories',
        description: 'Expenses missing category or subcategory information',
        severity: 'low',
        affectedRecords: expensesWithoutCategories.length,
        status: 'pending',
        createdAt: new Date(),
        details: expensesWithoutCategories
      });
    }

    // Check for inconsistent project amounts
    const inconsistentProjects = await prisma.project.findMany({
      where: {
        companyId,
        OR: [
          { agreementAmount: { lte: 0 } },
          { advancePaid: { lt: 0 } }
        ]
      },
      select: { id: true, name: true, agreementAmount: true, advancePaid: true, remainingAmount: true }
    });

    if (inconsistentProjects.length > 0) {
      issues.push({
        id: 'inconsistent-project-amounts',
        type: 'Inconsistent Project Amounts',
        description: 'Projects with invalid or negative amounts',
        severity: 'critical',
        affectedRecords: inconsistentProjects.length,
        status: 'pending',
        createdAt: new Date(),
        details: inconsistentProjects
      });
    }

    // Check for missing transaction descriptions
    const transactionsWithoutDescriptions = await prisma.transaction.findMany({
      where: {
        companyId,
        OR: [
          { description: '' }
        ]
      },
      select: { id: true, type: true, amount: true, transactionDate: true }
    });

    if (transactionsWithoutDescriptions.length > 0) {
      issues.push({
        id: 'transactions-without-descriptions',
        type: 'Transactions Without Descriptions',
        description: 'Transactions missing description information',
        severity: 'low',
        affectedRecords: transactionsWithoutDescriptions.length,
        status: 'pending',
        createdAt: new Date(),
        details: transactionsWithoutDescriptions
      });
    }

    return NextResponse.json({ 
      success: true, 
      issues: issues.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity as keyof typeof severityOrder] - severityOrder[a.severity as keyof typeof severityOrder];
      })
    });

  } catch (error: any) {
    console.error('Error fetching data issues:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch data issues', error: error.message },
      { status: 500 }
    );
  }
}

