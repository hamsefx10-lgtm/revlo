// app/api/expenses/categories/route.ts - Expense Categories API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyId } from './auth';

// GET /api/expenses/categories - Soo deji dhammaan noocyada kharashyada
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const categories = await prisma.expenseCategory.findMany({
      where: { companyId },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka noocyada kharashyada la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/expenses/categories - Ku dar nooc kharash cusub
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { name, type, description } = await request.json();
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca.' },
        { status: 400 }
      );
    }
    const existingCategory = await prisma.expenseCategory.findFirst({
      where: {
        AND: [
          { name: name },
          { companyId }
        ]
      },
    });
    if (existingCategory) {
      return NextResponse.json(
        { message: 'Noocan kharashka horey ayuu u jiray.' },
        { status: 409 }
      );
    }
    const newCategory = await prisma.expenseCategory.create({
      data: {
        name,
        type,
        description: description || null,
        companyId,
      },
    });
    return NextResponse.json(
      { message: 'Nooca kharashka si guul leh ayaa loo daray!', category: newCategory },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka nooca kharashka la darayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
