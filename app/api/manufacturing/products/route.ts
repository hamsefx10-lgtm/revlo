// app/api/manufacturing/products/route.ts - Product Catalog API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/products - Soo deji kataloogga alaabta
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const products = await prisma.productCatalog.findMany({
      where: { companyId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka kataloogga alaabta la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/manufacturing/products - Ku dar alaabta cusub
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();
    const { name, description, category, unit, standardCost, sellingPrice } = body;

    // Validation
    if (!name || !category || !unit) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Qaybta, Halbeegga.' },
        { status: 400 }
      );
    }

    if (standardCost < 0 || sellingPrice < 0) {
      return NextResponse.json(
        { message: 'Qiimaha iyo kharashka waa inay ka weyn yihiin ama u dhigaan 0.' },
        { status: 400 }
      );
    }

    // Check if product already exists
    const existingProduct = await prisma.productCatalog.findFirst({
      where: { 
        name,
        companyId 
      }
    });

    if (existingProduct) {
      return NextResponse.json(
        { message: 'Alaabtan horey ayay u diiwaan gashan tahay.' },
        { status: 409 }
      );
    }

    const newProduct = await prisma.productCatalog.create({
      data: {
        name,
        description: description || null,
        category,
        unit,
        standardCost: parseFloat(standardCost) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        companyId
      }
    });

    return NextResponse.json(
      { 
        message: 'Alaabta si guul leh ayaa loo daray!', 
        product: newProduct 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka alaabta la darayay:', error);
    return NextResponse.json(
      { message: `Cilad server ayaa dhacday: ${error instanceof Error ? error.message : 'Fadlan isku day mar kale.'}` },
      { status: 500 }
    );
  }
}

