import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/projects/[id]/materials - Get all materials for a project
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = params;
    const projectMaterials = await prisma.projectMaterial.findMany({
      where: { projectId },
      orderBy: { dateUsed: 'desc' },
    });
    return NextResponse.json({ materials: projectMaterials }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka alaabta mashruuca ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/materials - Add material to project
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = params;
    const { name, quantityUsed, unit, costPerUnit, leftoverQty } = await request.json();

    if (!name || !quantityUsed || !unit || !costPerUnit) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Magaca, Quantity, Unit, Qiimaha Unit.' },
        { status: 400 }
      );
    }
    if (typeof quantityUsed !== 'number' || quantityUsed <= 0) {
      return NextResponse.json(
        { message: 'Quantity waa inuu noqdaa nambar wanaagsan.' },
        { status: 400 }
      );
    }
    if (typeof costPerUnit !== 'number' || costPerUnit <= 0) {
      return NextResponse.json(
        { message: 'Qiimaha Unit waa inuu noqdaa nambar wanaagsan.' },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ message: 'Mashruuca lama helin.' }, { status: 404 });
    }

    const newProjectMaterial = await prisma.projectMaterial.create({
      data: {
        name,
        quantityUsed,
        unit,
        costPerUnit,
        leftoverQty: leftoverQty ?? 0,
        projectId,
      },
    });

    return NextResponse.json(
      { message: 'Alaabta si guul leh ayaa loo daray mashruuca!', material: newProjectMaterial },
      { status: 201 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka alaabta mashruuca ${params.id} la darayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}