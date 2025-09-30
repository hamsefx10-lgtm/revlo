import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch single vendor
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const vendor = await prisma.vendor.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        expenses: {
          orderBy: { expenseDate: 'desc' },
          select: {
            id: true,
            description: true,
            amount: true,
            expenseDate: true,
            category: true,
            paymentStatus: true,
            invoiceNumber: true,
            receiptUrl: true,
            projectId: true,
            project: { select: { id: true, name: true } },
          }
        },
        transactions: {
          orderBy: { transactionDate: 'desc' },
          select: {
            id: true,
            description: true,
            amount: true,
            type: true,
            transactionDate: true,
          }
        },
        materialPurchases: {
          orderBy: { purchaseDate: 'desc' },
          select: {
            id: true,
            materialName: true,
            quantity: true,
            unit: true,
            unitPrice: true,
            totalPrice: true,
            invoiceNumber: true,
            purchaseDate: true,
            productionOrderId: true,
          }
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Transform Decimal fields to numbers and compute aggregates
    const toNum = (v: any) => {
      if (v == null) return 0;
      if (typeof v === 'object' && 'toNumber' in v) return (v as any).toNumber();
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };

    const safeVendor: any = vendor ? {
      ...vendor,
      expenses: (vendor as any).expenses?.map((e: any) => ({
        ...e,
        amount: toNum(e.amount)
      })) || [],
      transactions: (vendor as any).transactions?.map((t: any) => ({
        ...t,
        amount: toNum(t.amount)
      })) || [],
      materialPurchases: (vendor as any).materialPurchases?.map((m: any) => ({
        ...m,
        totalPrice: toNum(m.totalPrice),
        unitPrice: toNum(m.unitPrice)
      })) || [],
    } : null;

    const totalPurchases = safeVendor.expenses.reduce((s: number, e: any) => s + toNum(e.amount), 0);
    const totalPaid = safeVendor.expenses
      .filter((e: any) => (e.paymentStatus || '').toUpperCase() === 'PAID')
      .reduce((s: number, e: any) => s + toNum(e.amount), 0);
    const totalUnpaid = safeVendor.expenses
      .filter((e: any) => (e.paymentStatus || 'UNPAID').toUpperCase() === 'UNPAID')
      .reduce((s: number, e: any) => s + toNum(e.amount), 0);
    const lastPurchaseDate = safeVendor.expenses[0]?.expenseDate || null;

    return NextResponse.json({
      success: true,
      vendor: {
        ...safeVendor,
        summary: {
          totalPurchases,
          totalPaid,
          totalUnpaid,
          lastPurchaseDate,
          projects: Array.from(new Set(safeVendor.expenses.map((e: any) => e.project?.name).filter(Boolean)))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
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

    const vendor = await prisma.vendor.update({
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
  } finally {
    await prisma.$disconnect();
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

    await prisma.vendor.delete({
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
  } finally {
    await prisma.$disconnect();
  }
}