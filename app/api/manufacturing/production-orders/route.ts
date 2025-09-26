// app/api/manufacturing/production-orders/route.ts - Production Orders API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/production-orders - Soo deji dhammaan amarka warshadaha
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const orders = await prisma.productionOrder.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        billOfMaterials: true,
        workOrders: {
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka amarka warshadaha la soo gelinayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// POST /api/manufacturing/production-orders - Ku dar amarka warshadaha cusub
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();
    const { 
      orderNumber, 
      productName, 
      quantity, 
      status, 
      priority, 
      startDate, 
      dueDate, 
      notes, 
      customerId,
      productId,
      billOfMaterials,
      workOrders 
    } = body;

    // Validation
    if (!orderNumber || !productName || !quantity) {
      return NextResponse.json(
        { message: 'Fadlan buuxi dhammaan beeraha waajibka ah: Lambarka Amarka, Magaca Alaabta, Tirada.' },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { message: 'Tirada waa inay ka weyn tahay 0.' },
        { status: 400 }
      );
    }

    // Check if order number already exists
    const existingOrder = await prisma.productionOrder.findFirst({
      where: { 
        orderNumber,
        companyId 
      }
    });

    if (existingOrder) {
      return NextResponse.json(
        { message: 'Lambarka amarkan horey ayuu u diiwaan gashan yahay.' },
        { status: 409 }
      );
    }

    // Create production order
    const newOrder = await prisma.productionOrder.create({
      data: {
        orderNumber,
        productName,
        quantity: parseInt(quantity),
        status: status || 'PLANNED',
        priority: priority || 'MEDIUM',
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        companyId,
        customerId: customerId || null,
        productId: productId || null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        },
        billOfMaterials: true,
        workOrders: true
      }
    });

    // Create bill of materials if provided
    if (billOfMaterials && billOfMaterials.length > 0) {
      for (const material of billOfMaterials) {
        await prisma.billOfMaterial.create({
          data: {
            materialName: material.materialName,
            quantity: parseFloat(material.quantity),
            unit: material.unit,
            costPerUnit: parseFloat(material.costPerUnit),
            totalCost: parseFloat(material.totalCost),
            notes: material.notes || null,
            companyId,
            productionOrderId: newOrder.id,
            productId: productId || null,
          }
        });
      }
    }

    // Create work orders if provided
    if (workOrders && workOrders.length > 0) {
      for (const workOrder of workOrders) {
        await prisma.workOrder.create({
          data: {
            stage: workOrder.stage,
            description: workOrder.description || null,
            estimatedHours: parseFloat(workOrder.estimatedHours),
            actualHours: workOrder.actualHours ? parseFloat(workOrder.actualHours) : null,
            status: workOrder.status || 'PENDING',
            startTime: workOrder.startTime ? new Date(workOrder.startTime) : null,
            endTime: workOrder.endTime ? new Date(workOrder.endTime) : null,
            notes: workOrder.notes || null,
            companyId,
            productionOrderId: newOrder.id,
            assignedToId: workOrder.assignedToId || null,
          }
        });
      }
    }

    return NextResponse.json(
      { 
        message: 'Amarka warshadaha si guul leh ayaa loo daray!', 
        order: newOrder 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka amarka warshadaha la darayay:', error);
    return NextResponse.json(
      { message: `Cilad server ayaa dhacday: ${error instanceof Error ? error.message : 'Fadlan isku day mar kale.'}` },
      { status: 500 }
    );
  }
}
