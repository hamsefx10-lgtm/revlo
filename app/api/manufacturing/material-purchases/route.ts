import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/material-purchases
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where: any = { companyId };

    if (search) {
      where.OR = [
        { materialName: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { vendor: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const purchases = await prisma.materialPurchase.findMany({
      where,
      orderBy: { purchaseDate: 'desc' },
      include: {
        vendor: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ message: 'Error fetching purchases' }, { status: 500 });
  }
}

// POST /api/manufacturing/material-purchases
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    // 1. Create Purchase Record
    const purchase = await prisma.materialPurchase.create({
      data: {
        companyId,
        materialName: body.materialName,
        quantity: parseFloat(body.quantity),
        unit: body.unit,
        unitPrice: parseFloat(body.unitPrice),
        totalPrice: parseFloat(body.totalPrice),
        vendorId: body.vendorId,
        purchaseDate: new Date(body.purchaseDate),
        invoiceNumber: body.invoiceNumber,
        notes: body.notes
      }
    });

    // 2. Automate Inventory Update?
    // If the user selects "Update Inventory", we should increase stock.
    // For now, let's assume we do if the material exists in InventoryItem.
    if (body.updateInventory) {
      const item = await prisma.inventoryItem.findFirst({
        where: { name: body.materialName, companyId }
      });

      if (item) {
        // Update average cost? Or just increment stock?
        // Simple increment for now.
        await prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            inStock: { increment: parseFloat(body.quantity) },
            purchasePrice: parseFloat(body.unitPrice) // Update latest cost
          }
        });
      } else {
        // Create item if not exists? Maybe optional.
        // Let's create it.
        await prisma.inventoryItem.create({
          data: {
            companyId,
            name: body.materialName,
            category: 'Raw Materials',
            unit: body.unit,
            inStock: parseFloat(body.quantity),
            minStock: 0,
            purchasePrice: parseFloat(body.unitPrice),
            sellingPrice: 0
          }
        });
      }
    }

    return NextResponse.json({ purchase, message: 'Purchase recorded' });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ message: 'Error creating purchase' }, { status: 500 });
  }
}
