import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/products
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';

    const where: any = {
      companyId,
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    if (category) {
      where.category = category;
    }

    const products = await prisma.productCatalog.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { billOfMaterials: true }
        }
      }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ message: 'Error fetching products' }, { status: 500 });
  }
}

// POST /api/manufacturing/products
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    const product = await prisma.productCatalog.create({
      data: {
        companyId,
        name: body.name,
        description: body.description,
        category: body.category,
        unit: body.unit,
        standardCost: parseFloat(body.standardCost) || 0,
        sellingPrice: parseFloat(body.sellingPrice) || 0,
        isActive: body.isActive !== false
      }
    });

    return NextResponse.json({ product, message: 'Product created successfully' });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ message: 'Error creating product' }, { status: 500 });
  }
}
