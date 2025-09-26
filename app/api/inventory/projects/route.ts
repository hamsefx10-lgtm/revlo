// app/api/inventory/projects/route.ts - Inventory Projects API Route
import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Import Prisma Client
import { USER_ROLES } from '@/lib/constants'; // Import user roles constants
import { getSessionCompanyId } from './auth';

// GET /api/inventory/projects - Soo deji dhammaan alaabta loo isticmaalay mashaariicda
// Tani waxay soo celinaysaa diiwaanka alaabta loo isticmaalay mashaariicda kala duwan.
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const projectMaterials = await prisma.projectMaterial.findMany({
      where: { project: { companyId } },
      include: {
        project: { select: { name: true, customer: { select: { name: true } } } }
      },
      orderBy: { dateUsed: 'desc' },
    });
    return NextResponse.json({ projectMaterials }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka alaabta mashaariicda la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/inventory/projects - Ku dar diiwaan cusub oo alaab loo isticmaalay mashruuc
// Tani waxay diiwaan galinaysaa isticmaalka alaab gaar ah mashruuc gaar ah.
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const { projectId, itemId, quantityUsed, leftoverQty } = await request.json();
    if (!projectId || !itemId || typeof quantityUsed !== 'number' || quantityUsed <= 0) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Mashruuca ID, Alaabta ID, Quantity La Isticmaalay.' },
        { status: 400 }
      );
    }
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.companyId !== companyId) {
      return NextResponse.json({ message: 'Mashruuca lama helin.' }, { status: 404 });
    }
    const inventoryItem = await prisma.inventoryItem.findUnique({ where: { id: itemId, companyId } });
    if (!inventoryItem) {
      return NextResponse.json({ message: 'Alaabta bakhaarka lama helin.' }, { status: 404 });
    }
    if (inventoryItem.inStock < quantityUsed) {
      return NextResponse.json(
        { message: `Stock-ga '${inventoryItem.name}' ma ku filna. Hadda stock-gu waa ${inventoryItem.inStock} ${inventoryItem.unit}.` },
        { status: 400 }
      );
    }
    const newProjectMaterial = await prisma.projectMaterial.create({
      data: {
        name: inventoryItem.name,
        quantityUsed,
        unit: inventoryItem.unit,
        costPerUnit: inventoryItem.purchasePrice,
        leftoverQty: parseFloat(leftoverQty || 0),
        projectId: projectId,
      },
    });
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        inStock: inventoryItem.inStock - quantityUsed,
        usedInProjects: inventoryItem.usedInProjects + quantityUsed,
        lastUpdated: new Date(),
      },
    });
    return NextResponse.json(
      { message: `Alaabta '${newProjectMaterial.name}' si guul leh ayaa loo diiwaan geliyay mashruuca!`, projectMaterial: newProjectMaterial },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka alaabta mashaariicda la darayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
