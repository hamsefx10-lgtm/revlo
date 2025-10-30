import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// POST /api/expenses/bulk-reset - Delete all expenses and reset account balances
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    let deletedExpenses = 0;
    let deletedTransactions = 0;
    let resetAccounts = 0;

    console.log(`Starting bulk reset for company ${companyId}`);

    // 1. Get all expenses for backup
    const allExpenses = await prisma.expense.findMany({
      where: { companyId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            balance: true
          }
        }
      }
    });

    console.log(`Found ${allExpenses.length} expenses to delete`);

    // 2. Reset all account balances to 0
    const accounts = await prisma.account.findMany({
      where: { companyId }
    });

    for (const account of accounts) {
      await prisma.account.update({
        where: { id: account.id },
        data: { balance: 0 }
      });
      resetAccounts++;
    }

    console.log(`Reset ${resetAccounts} account balances to 0`);

    // 3. Delete all transactions
    const deleteTransactions = await prisma.transaction.deleteMany({
      where: { companyId }
    });
    deletedTransactions = deleteTransactions.count;

    console.log(`Deleted ${deletedTransactions} transactions`);

    // 4. Delete all project labor records
    const projectLabors = await prisma.projectLabor.findMany({
      where: {
        project: { companyId }
      }
    });

    for (const labor of projectLabors) {
      await prisma.projectLabor.delete({
        where: { id: labor.id }
      });
    }

    console.log(`Deleted ${projectLabors.length} project labor records`);

    // 5. Delete all expenses
    const deleteExpenses = await prisma.expense.deleteMany({
      where: { companyId }
    });
    deletedExpenses = deleteExpenses.count;

    console.log(`Deleted ${deletedExpenses} expenses`);

    // 6. Reset employee salary tracking
    await prisma.employee.updateMany({
      where: { companyId },
      data: {
        salaryPaidThisMonth: 0,
        lastPaymentDate: null
      }
    });

    console.log(`Reset employee salary tracking`);

    return NextResponse.json({
      success: true,
      message: 'All expenses deleted and account balances reset successfully!',
      stats: {
        deletedExpenses,
        deletedTransactions,
        resetAccounts,
        resetProjectLabors: projectLabors.length,
        backupExpenses: allExpenses.length
      },
      backup: {
        expenses: allExpenses.map(expense => ({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category,
          subCategory: expense.subCategory,
          paidFrom: expense.paidFrom,
          expenseDate: expense.expenseDate,
          note: expense.note,
          projectId: expense.projectId,
          employeeId: expense.employeeId,
          customerId: expense.customerId,
          vendorId: expense.vendorId,
          materials: expense.materials,
          receiptUrl: expense.receiptUrl,
          materialDate: expense.materialDate,
          transportType: expense.transportType,
          consultantName: expense.consultantName,
          consultancyType: expense.consultancyType,
          consultancyFee: expense.consultancyFee,
          equipmentName: expense.equipmentName,
          rentalPeriod: expense.rentalPeriod,
          rentalFee: expense.rentalFee,
          supplierName: expense.supplierName,
          bankAccountId: expense.bankAccountId,
          approved: expense.approved,
          createdAt: expense.createdAt,
          updatedAt: expense.updatedAt
        }))
      }
    });

  } catch (error) {
    console.error('Error during bulk reset:', error);
    return NextResponse.json(
      { error: 'Failed to reset expenses', details: error },
      { status: 500 }
    );
  }
}
