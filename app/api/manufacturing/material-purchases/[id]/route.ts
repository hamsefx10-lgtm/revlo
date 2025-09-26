import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch single material purchase
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const materialPurchase = await prisma.materialPurchase.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true
          }
        },
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
            status: true
          }
        }
      }
    });

    if (!materialPurchase) {
      return NextResponse.json({ error: 'Material purchase not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      materialPurchase
    });

  } catch (error) {
    console.error('Error fetching material purchase:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material purchase' },
      { status: 500 }
    );
  }
}

// PUT - Update material purchase
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
      materialName,
      quantity,
      unit,
      unitPrice,
      totalPrice,
      vendorId,
      purchaseDate,
      invoiceNumber,
      notes,
      productionOrderId,
      accountId
    } = await request.json();

    // Validate required fields
    if (!materialName || !quantity || !unitPrice || !vendorId || !purchaseDate || !accountId) {
      return NextResponse.json(
        { error: 'Material name, quantity, unit price, vendor, purchase date, and account are required' },
        { status: 400 }
      );
    }

    // Check if material purchase exists
    const existingPurchase = await prisma.materialPurchase.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      }
    });

    if (!existingPurchase) {
      return NextResponse.json({ error: 'Material purchase not found' }, { status: 404 });
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        companyId: session.user.companyId
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Check if account exists
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId: session.user.companyId,
        isActive: true
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found or inactive' }, { status: 404 });
    }

    const purchaseAmount = parseFloat(totalPrice) || parseFloat(quantity) * parseFloat(unitPrice);
    
    // Check if account has sufficient balance (only if amount increased)
    if (purchaseAmount > existingPurchase.totalPrice) {
      const additionalAmount = purchaseAmount - existingPurchase.totalPrice;
      if (account.balance < additionalAmount) {
        return NextResponse.json(
          { error: `Insufficient balance. Available: ${account.balance}, Required: ${additionalAmount}` },
          { status: 400 }
        );
      }
    }

    // Update material purchase
    const updatedPurchase = await prisma.materialPurchase.update({
      where: { id: params.id },
      data: {
        materialName,
        quantity: parseFloat(quantity),
        unit,
        unitPrice: parseFloat(unitPrice),
        totalPrice: purchaseAmount,
        vendorId,
        purchaseDate: new Date(purchaseDate),
        invoiceNumber,
        notes,
        productionOrderId: productionOrderId || null,
        accountId
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true
          }
        },
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
            status: true
          }
        }
      }
    });

    // Update account balance if amount changed
    if (purchaseAmount !== existingPurchase.totalPrice) {
      const difference = purchaseAmount - existingPurchase.totalPrice;
      await prisma.account.update({
        where: { id: accountId },
        data: {
          balance: account.balance - difference
        }
      });
    }

    // Update transaction if it exists
    try {
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          description: { contains: existingPurchase.materialName },
          companyId: session.user.companyId,
          type: 'EXPENSE',
          category: 'Material Purchase'
        }
      });

      if (existingTransaction) {
        await prisma.transaction.update({
          where: { id: existingTransaction.id },
          data: {
            description: `Alaabta la soo gashay: ${materialName}`,
            amount: purchaseAmount,
            transactionDate: new Date(purchaseDate),
            vendorId: vendorId,
            accountId: accountId
          }
        });
      }
    } catch (transactionError) {
      console.warn('Transaction update failed:', transactionError);
    }

    return NextResponse.json({
      success: true,
      message: 'Material purchase updated successfully',
      materialPurchase: updatedPurchase
    });

  } catch (error) {
    console.error('Error updating material purchase:', error);
    return NextResponse.json(
      { error: 'Failed to update material purchase' },
      { status: 500 }
    );
  }
}

// DELETE - Delete material purchase
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if material purchase exists
    const existingPurchase = await prisma.materialPurchase.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        account: true
      }
    });

    if (!existingPurchase) {
      return NextResponse.json({ error: 'Material purchase not found' }, { status: 404 });
    }

    // Refund the amount to the account
    if (existingPurchase.account) {
      await prisma.account.update({
        where: { id: existingPurchase.account.id },
        data: {
          balance: existingPurchase.account.balance + existingPurchase.totalPrice
        }
      });
    }

    // Delete related transaction
    try {
      await prisma.transaction.deleteMany({
        where: {
          description: { contains: existingPurchase.materialName },
          companyId: session.user.companyId,
          type: 'EXPENSE',
          category: 'Material Purchase'
        }
      });
    } catch (transactionError) {
      console.warn('Transaction deletion failed:', transactionError);
    }

    // Delete the material purchase
    await prisma.materialPurchase.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Material purchase deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting material purchase:', error);
    return NextResponse.json(
      { error: 'Failed to delete material purchase' },
      { status: 500 }
    );
  }
}
