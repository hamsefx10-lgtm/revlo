import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch all material purchases for the company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const materialPurchases = await prisma.materialPurchase.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
          },
        },
        productionOrder: {
          select: {
            id: true,
            orderNumber: true,
            productName: true,
          },
        },
      },
      orderBy: {
        purchaseDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      materialPurchases: materialPurchases || []
    });
  } catch (error) {
    console.error('Error fetching material purchases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch material purchases' },
      { status: 500 }
    );
  }
}

// POST - Create a new material purchase
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session || !session.user || !session.user.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
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
      accountId, // Account from which to deduct money
    } = body;

    // Validate required fields
    if (!materialName || !quantity || !unitPrice || !vendorId || !purchaseDate || !accountId) {
      return NextResponse.json(
        { error: 'Material name, quantity, unit price, vendor, purchase date, and account are required' },
        { status: 400 }
      );
    }

    // Check if vendor exists
    const vendor = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        companyId: session.user.companyId,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if account exists and has sufficient balance
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        companyId: session.user.companyId,
        isActive: true
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found or inactive' },
        { status: 404 }
      );
    }

    const purchaseAmount = parseFloat(totalPrice) || parseFloat(quantity) * parseFloat(unitPrice);
    
    if (account.balance < purchaseAmount) {
      return NextResponse.json(
        { error: `Insufficient balance. Available: ${account.balance}, Required: ${purchaseAmount}` },
        { status: 400 }
      );
    }

    // Check if production order exists (if provided)
    if (productionOrderId) {
      const productionOrder = await prisma.productionOrder.findFirst({
        where: {
          id: productionOrderId,
          companyId: session.user.companyId,
        },
      });

      if (!productionOrder) {
        return NextResponse.json(
          { error: 'Production order not found' },
          { status: 404 }
        );
      }
    }

    // Create material purchase
    const materialPurchase = await prisma.materialPurchase.create({
      data: {
        materialName,
        quantity: parseFloat(quantity),
        unit: unit || 'pcs',
        unitPrice: parseFloat(unitPrice),
        totalPrice: parseFloat(totalPrice) || parseFloat(quantity) * parseFloat(unitPrice),
        vendorId,
        purchaseDate: new Date(purchaseDate),
        invoiceNumber,
        notes,
        companyId: session.user.companyId,
        productionOrderId: productionOrderId || null,
      },
    });

    // Update account balance (deduct money)
    await prisma.account.update({
      where: { id: accountId },
      data: {
        balance: account.balance - purchaseAmount
      }
    });

    // Create accounting transaction for the purchase
    try {
      await prisma.transaction.create({
        data: {
          description: `Alaabta la soo gashay: ${materialName}`,
          amount: purchaseAmount,
          type: 'EXPENSE',
          category: 'Material Purchase',
          transactionDate: new Date(purchaseDate),
          companyId: session.user.companyId,
          vendorId: vendorId,
          accountId: accountId,
        },
      });
    } catch (transactionError) {
      console.warn('Transaction creation failed:', transactionError);
      // Don't fail the purchase if transaction creation fails
    }

    // Update inventory automatically
    try {
      const existingItem = await prisma.inventoryItem.findFirst({
        where: {
          name: materialName,
          companyId: session.user.companyId,
        },
      });

      if (existingItem) {
        // Update existing inventory item
        await prisma.inventoryItem.update({
          where: { id: existingItem.id },
          data: {
            inStock: existingItem.inStock + parseFloat(quantity),
            lastUpdated: new Date(),
          },
        });
      } else {
        // Create new inventory item for raw material
        await prisma.inventoryItem.create({
          data: {
            name: materialName,
            category: 'Raw Materials',
            inStock: parseFloat(quantity),
            unit: unit || 'pcs',
            sellingPrice: parseFloat(unitPrice) * 1.2, // 20% markup
            minStock: 10,
            purchasePrice: parseFloat(unitPrice),
            company: {
              connect: { id: session.user.companyId }
            }
          },
        });
      }
    } catch (inventoryError) {
      console.warn('Inventory update failed:', inventoryError);
      // Don't fail the purchase if inventory update fails
    }

    return NextResponse.json({
      ...materialPurchase,
      message: 'Material purchase created and inventory updated successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating material purchase:', error);
    return NextResponse.json(
      { error: 'Failed to create material purchase' },
      { status: 500 }
    );
  }
}

