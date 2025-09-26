import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../admin/auth';
import prisma from '@/lib/db';

// GET /api/settings/categories - Get all expense categories
export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.expenseCategory.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ 
      categories,
      message: 'Categories retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/settings/categories - Create new expense category
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { name, type, description } = await request.json();

    if (!name || !type) {
      return NextResponse.json(
        { message: 'Name and type are required' },
        { status: 400 }
      );
    }

    const category = await prisma.expenseCategory.create({
      data: {
        name,
        type,
        description: description || '',
        companyId,
      },
    });

    return NextResponse.json({ 
      category,
      message: 'Category created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'Failed to create category' },
      { status: 500 }
    );
  }
}

