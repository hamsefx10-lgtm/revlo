import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch single vendor with comprehensive financial data
import { TransactionType } from '@prisma/client';

const MONEY_OUT_TYPES: TransactionType[] = [
  TransactionType.EXPENSE,
  TransactionType.DEBT_REPAID,
  TransactionType.TRANSFER_OUT
];

const MONEY_IN_TYPES: TransactionType[] = [
  TransactionType.INCOME,
  TransactionType.DEBT_TAKEN,
  TransactionType.TRANSFER_IN
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.shopVendor.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          include: {
            // project relation now exists on PurchaseOrder
            project: { select: { id: true, name: true } },
            items: true, // valid relation
            expenses: {
              include: {
                project: { select: { id: true, name: true } }
              }
            }
          }
        },
        materialPurchases: {
          orderBy: { purchaseDate: 'desc' }
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          include: {
            project: { select: { id: true, name: true } },
            // Include transactions to calculate paidAmount
            transactions: {
              select: {
                id: true,
                amount: true,
                type: true
              }
            }
          }
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          include: {
            account: { select: { id: true, name: true, type: true } },
            fromAccount: { select: { id: true, name: true, type: true } },
            toAccount: { select: { id: true, name: true, type: true } },
            expense: {
              select: {
                id: true,
                description: true,
                paymentStatus: true,
                amount: true
              }
            }
          }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Cast to any to avoid TypeScript errors with complex Prisma includes
    const vendorData = vendor as any;

    // Safely handle potentially undefined arrays
    const rawExpenses = vendorData.expenses || [];
    const transactions = vendorData.transactions || [];
    const purchaseOrders = vendorData.purchaseOrders || [];

    // 1. Gather all unique expenses (from direct link OR via transactions)
    const allExpensesMap = new Map<string, any>();

    // Add directly linked expenses
    rawExpenses.forEach((exp: any) => {
      allExpensesMap.set(exp.id, { ...exp });
    });

    // Add expenses linked via transactions (but missing vendorId on expense)
    transactions.forEach((tr: any) => {
      if (tr.expense) {
        if (!allExpensesMap.has(tr.expense.id)) {
          // We need to construct a partial expense object from the transaction data
          // We use transaction date as fallback for expense date
          const discoveredExp = {
            ...tr.expense,
            expenseDate: tr.transactionDate,
            // Project might be missing if not loaded in transaction include, but that's acceptable for now
          };
          allExpensesMap.set(tr.expense.id, discoveredExp);
        }
      }
    });

    // 2. Calculate paidAmount and Status for ALL expenses
    const allExpenses = Array.from(allExpensesMap.values());

    allExpenses.forEach((exp: any) => {
      // Find all payments for this expense (from the vendor's transaction list)
      const relatedTransactions = transactions.filter((t: any) =>
        t.expense?.id === exp.id &&
        ['EXPENSE', 'DEBT_REPAID'].includes(t.type)
      );

      const paidVal = relatedTransactions.reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || 0)), 0);

      exp.paidAmount = paidVal;

      // Override status based on calculation
      const expAmount = Number(exp.amount || 0);

      // Logic: If fully paid, mark PAID. If partially paid, mark PARTIAL.
      if (expAmount > 0 && paidVal >= expAmount) {
        exp.paymentStatus = 'PAID';
      } else if (paidVal > 0 && paidVal < expAmount) {
        exp.paymentStatus = 'PARTIAL';
      } else {
        // If 0 paid, ensure it is UNPAID (unless it is somehow 0 amount?)
        if (exp.paymentStatus !== 'PAID') exp.paymentStatus = 'UNPAID';
      }
    });

    // Sort by date (descending)
    allExpenses.sort((a, b) => new Date(b.expenseDate || 0).getTime() - new Date(a.expenseDate || 0).getTime());

    // Inject updated status and paidAmount back into transactions list for UI consistency
    transactions.forEach((tr: any) => {
      if (tr.expense) {
        const currentExp = allExpensesMap.get(tr.expense.id);
        if (currentExp) {
          tr.expense.paidAmount = currentExp.paidAmount;
          tr.expense.paymentStatus = currentExp.paymentStatus;
        }
      }
    });

    // Calculate financial summary
    // Total purchases now uses allExpenses (so it includes the discovered ones)
    const totalPurchases = allExpenses.reduce((sum: number, exp: any) => sum + Number(exp.amount || 0), 0);

    // Total paid: sum of MONEY_OUT transactions to this vendor
    const totalPaid = transactions
      .filter((t: any) => MONEY_OUT_TYPES.includes(t.type as TransactionType))
      .reduce((sum: number, t: any) => sum + Math.abs(Number(t.amount || 0)), 0);

    // Total received: sum of MONEY_IN transactions from this vendor (vendor owes us)
    const vendorOwesUs = transactions
      .filter((t: any) => MONEY_IN_TYPES.includes(t.type as TransactionType))
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0);

    // Balance we owe = purchases - paid
    const totalUnpaid = totalPurchases - totalPaid;

    // Net balance: positive = we owe vendor, negative = vendor owes us
    const netBalance = totalUnpaid - vendorOwesUs;

    // Find last purchase and payment dates
    const lastPurchaseDate = allExpenses.length > 0 ? allExpenses[0].expenseDate : null;
    const lastPaymentDate = transactions.find((t: any) => MONEY_OUT_TYPES.includes(t.type as TransactionType))?.transactionDate || null;

    // Find oldest unpaid expense
    const unpaidExpenses = allExpenses.filter((exp: any) => exp.paymentStatus !== 'PAID');
    const oldestUnpaidDate = unpaidExpenses.length > 0
      ? unpaidExpenses[unpaidExpenses.length - 1]?.expenseDate
      : null;
    const unpaidCount = unpaidExpenses.length;

    // Get unique project names
    const projectNames = Array.from(
      new Set([
        ...purchaseOrders.map((po: any) => po.project?.name).filter(Boolean),
        ...purchaseOrders.map((po: any) => po.expenses?.[0]?.project?.name).filter(Boolean),
        ...allExpenses.map((exp: any) => exp.project?.name).filter(Boolean)
      ])
    );

    return NextResponse.json({
      success: true,
      vendor: {
        ...vendorData,
        // Ensure arrays are always present
        purchaseOrders,
        materialPurchases: vendorData.materialPurchases || [],
        expenses: allExpenses, // Return the consolidated list
        transactions,
        summary: {
          totalPurchases: Number(totalPurchases),
          totalPaid: Number(totalPaid),
          totalUnpaid: Number(totalUnpaid),
          vendorOwesUs: Number(vendorOwesUs),
          netBalance: Number(netBalance),
          lastPurchaseDate,
          lastPaymentDate,
          oldestUnpaidDate,
          unpaidCount,
          projects: projectNames
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch vendor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      type,
      contactPerson,
      phone,
      phoneNumber,
      email,
      address,
      productsServices,
      notes
    } = await request.json();

    const vendor = await prisma.shopVendor.update({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      data: {
        name,
        type,
        contactPerson,
        phone,
        phoneNumber,
        email,
        address,
        productsServices,
        notes
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor updated successfully',
      vendor
    });

  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.shopVendor.delete({
      where: {
        id: params.id,
        companyId: session.user.companyId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Vendor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
}