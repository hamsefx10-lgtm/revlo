import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/products/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const product = await prisma.productCatalog.findFirst({
      where: { id: params.id, companyId },
      include: {
        billOfMaterials: true
      }
    });

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ message: 'Error fetching product' }, { status: 500 });
  }
}

// PUT /api/manufacturing/products/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    const product = await prisma.productCatalog.updateMany({
      where: { id: params.id, companyId },
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        unit: body.unit,
        standardCost: body.standardCost,
        sellingPrice: body.sellingPrice,
        isActive: body.isActive
      }
    });

    if (product.count === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ message: 'Error updating product' }, { status: 500 });
  }
}

// DELETE /api/manufacturing/products/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();

    // Check usage?
    const count = await prisma.productCatalog.deleteMany({
      where: { id: params.id, companyId }
    });

    if (count.count === 0) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ message: 'Cannot delete product (may be used in orders)' }, { status: 500 });
  }
}
