// app/api/inventory/store/[id]/route.ts - Single Inventory Item Management API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyId } from './auth';

// GET /api/inventory/store/[id] - Soo deji alaab gaar ah
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    const inventoryItem = await prisma.inventoryItem.findUnique({ where: { id, companyId } });
    if (!inventoryItem) {
      return NextResponse.json({ message: 'Alaabta lama helin.' }, { status: 404 });
    }
    return NextResponse.json({ item: inventoryItem }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka alaabta ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/inventory/store/[id] - Cusboonaysii alaab gaar ah
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    const { name, category, unit, inStock, minStock, purchasePrice, sellingPrice, usedInProjects } = await request.json();
    if (!name || !category || !unit || typeof inStock !== 'number' || typeof minStock !== 'number' || typeof purchasePrice !== 'number' || typeof sellingPrice !== 'number') {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' },
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
    const updatedItem = await prisma.inventoryItem.update({
      where: { id, companyId },
      data: {
        name,
        category,
        unit,
        inStock, 
        minStock, 
        purchasePrice,
        sellingPrice,
        usedInProjects,
        lastUpdated: new Date(),
      },
    });
    return NextResponse.json(
      { message: 'Alaabta si guul leh ayaa loo cusboonaysiiyay!', item: updatedItem },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka alaabta ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/inventory/store/[id] - Tirtir alaab gaar ah
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    const existingItem = await prisma.inventoryItem.findUnique({ where: { id, companyId } });
    if (!existingItem) {
      return NextResponse.json({ message: 'Alaabta lama helin.' }, { status: 404 });
    }
    await prisma.inventoryItem.delete({ where: { id, companyId } });
    return NextResponse.json(
      { message: 'Alaabta si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka alaabta ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
