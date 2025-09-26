// app/api/manufacturing/production-orders/[id]/route.ts - Single Production Order API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/manufacturing/auth';

// GET /api/manufacturing/production-orders/[id] - Soo deji amarka warshadaha gaar ah
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    const order = await prisma.productionOrder.findFirst({
      where: { id, companyId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            description: true,
            category: true,
            standardCost: true,
            sellingPrice: true
          }
        },
        billOfMaterials: {
          orderBy: { createdAt: 'asc' }
        },
        workOrders: {
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true,
                role: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ message: 'Amarka warshadaha lama helin.' }, { status: 404 });
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka amarka warshadaha ${params.id} la soo gelinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/manufacturing/production-orders/[id] - Cusboonaysii amarka warshadaha
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    const body = await request.json();

    // Verify order exists and belongs to company
    const existingOrder = await prisma.productionOrder.findFirst({
      where: { id, companyId }
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Amarka warshadaha lama helin.' }, { status: 404 });
    }

    const updatedOrder = await prisma.productionOrder.update({
      where: { id },
      data: {
        orderNumber: body.orderNumber,
        productName: body.productName,
        quantity: body.quantity ? parseInt(body.quantity) : undefined,
        status: body.status,
        priority: body.priority,
        startDate: body.startDate ? new Date(body.startDate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        completedDate: body.completedDate ? new Date(body.completedDate) : null,
        notes: body.notes,
        customerId: body.customerId,
        productId: body.productId,
      },
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

    return NextResponse.json(
      { 
        message: 'Amarka warshadaha si guul leh ayaa la cusboonaysiiyay!', 
        order: updatedOrder 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka amarka warshadaha ${params.id} la cusboonaysiinayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// DELETE /api/manufacturing/production-orders/[id] - Tirtir amarka warshadaha
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();

    // Verify order exists and belongs to company
    const existingOrder = await prisma.productionOrder.findFirst({
      where: { id, companyId }
    });

    if (!existingOrder) {
      return NextResponse.json({ message: 'Amarka warshadaha lama helin.' }, { status: 404 });
    }

    // Delete order (cascade will handle related records)
    await prisma.productionOrder.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Amarka warshadaha si guul leh ayaa loo tirtiray!' },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Cilad ayaa dhacday marka amarka warshadaha ${params.id} la tirtirayay:`, error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
