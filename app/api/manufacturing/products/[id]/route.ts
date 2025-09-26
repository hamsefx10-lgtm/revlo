import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    const product = await prisma.productCatalog.findFirst({
      where: {
        id: productId,
        companyId: session.user.companyId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;
    const body = await request.json();
    const { name, description, category, unit, standardCost, sellingPrice } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const existingProduct = await prisma.productCatalog.findFirst({
      where: {
        id: productId,
        companyId: session.user.companyId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (excluding current product)
    const nameExists = await prisma.productCatalog.findFirst({
      where: {
        name: name,
        companyId: session.user.companyId,
        id: { not: productId },
      },
    });

    if (nameExists) {
      return NextResponse.json(
        { error: 'Product name already exists' },
        { status: 400 }
      );
    }

    // Update product
    const updatedProduct = await prisma.productCatalog.update({
      where: {
        id: productId,
      },
      data: {
        name,
        description,
        category,
        unit,
        standardCost: standardCost ? parseFloat(standardCost) : 0,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const productId = params.id;

    // Check if product exists
    const existingProduct = await prisma.productCatalog.findFirst({
      where: {
        id: productId,
        companyId: session.user.companyId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is used in any production orders
    const productionOrders = await prisma.productionOrder.findMany({
      where: {
        productId: productId,
        companyId: session.user.companyId,
      },
    });

    if (productionOrders.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that is used in production orders' },
        { status: 400 }
      );
    }

    // Delete product
    await prisma.productCatalog.delete({
      where: {
        id: productId,
      },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

