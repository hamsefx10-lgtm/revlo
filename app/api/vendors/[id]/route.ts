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

    const vendor = await prisma.shopVendor.findFirst({
      where: {
        id: params.id,
        companyId: session.user.companyId
      },
      include: {
        // expenses (removed as they are unrelated to ShopVendor in simple mode for now or maintained if relation exists)
        // Adjusting include based on schema: ShopVendor has materialPurchases, PurchaseOrders. Expenses relation might not be direct or named 'expenses'.
        // Checking schema: ShopVendor has 'expenses Expense[]' commented out in schema provided previously. 
        // Assuming we rely on MaterialPurchases or PurchaseOrders. 
        // user Request: 'projects integration'.
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          // include: { project: { select: { id: true, name: true } } }
        },
        materialPurchases: {
          orderBy: { purchaseDate: 'desc' },
          take: 20
        }
      }
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    // Simplified response transformation for ShopVendor
    const safeVendor: any = {
      ...vendor,
      // Default to empty arrays if missing
      purchaseOrders: (vendor as any).purchaseOrders || [],
      materialPurchases: (vendor as any).materialPurchases || []
    };

    // Calculate Summary from available data (e.g. Purchase Orders)
    const totalPurchases = safeVendor.purchaseOrders.reduce((sum: number, po: any) => sum + Number(po.totalAmount || 0), 0);
    // Placeholder logic for paid/unpaid as it depends on payments model
    const totalPaid = 0;
    const totalUnpaid = totalPurchases - totalPaid;

    const lastPurchaseDate = safeVendor.purchaseOrders[0]?.createdAt || null;
    const projectNames = Array.from(new Set(safeVendor.purchaseOrders.map((po: any) => po.project?.name).filter(Boolean)));

    return NextResponse.json({
      success: true,
      vendor: {
        ...safeVendor,
        summary: {
          totalPurchases,
          totalPaid,
          totalUnpaid,
          lastPurchaseDate,
          projects: projectNames
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
  } finally {
    await prisma.$disconnect();
  }
}