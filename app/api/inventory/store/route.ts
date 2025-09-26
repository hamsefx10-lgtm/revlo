// app/api/inventory/store/route.ts - Inventory Store API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyId } from './auth';

// GET /api/inventory/store - Soo deji dhammaan alaabta bakhaarka
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { searchParams } = new URL(request.url);
    const usage = searchParams.get('usage');
    let where: any = { companyId };
    if (usage === 'company') {
      // Only items not used in projects (company usage)
      where.usedInProjects = 0;
    }
    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json({ usages: inventoryItems }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka alaabta bakhaarka la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/store - Ku dar alaab cusub bakhaarka
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { 
      name, category, unit, inStock, minStock, purchasePrice, sellingPrice
    } = await request.json();
    if (!name || !category || !unit || typeof inStock !== 'number' || typeof minStock !== 'number' || typeof purchasePrice !== 'number' || typeof sellingPrice !== 'number') {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Nooca, Unit, In Stock, Min Stock, Qiimaha Gadashada, Qiimaha Iibka.' },
        { status: 400 }
      );
    }
    if (inStock < 0 || minStock < 0 || purchasePrice < 0 || sellingPrice < 0) {
      return NextResponse.json(
        { message: 'Qiimaha iyo tirada waa inay noqdaan nambaro wanaagsan (ama eber).' },
        { status: 400 }
      );
    }
    if (sellingPrice < purchasePrice) {
      return NextResponse.json(
        { message: 'Qiimaha iibka ma noqon karo mid ka yar qiimaha gadashada.' },
        { status: 400 }
      );
    }
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        AND: [
          { name: name },
          { companyId }
        ]
      },
    });
    if (existingItem) {
      return NextResponse.json(
        { message: 'Alaabtan horey ayay ugu jirtay bakhaarka.' },
        { status: 409 }
      );
    }
    const newItem = await prisma.inventoryItem.create({
      data: {
        name,
        category,
        unit,
        inStock,
        minStock,
        purchasePrice,
        sellingPrice,
        usedInProjects: 0,
        companyId,
      },
    });
    return NextResponse.json(
      { message: 'Alaabta si guul leh ayaa loogu daray bakhaarka!', item: newItem },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka alaabta bakhaarka la darayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
