import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PROJECT_STATUSES } from '@/lib/constants';
import { getSessionCompanyId } from './auth';

// GET /api/projects/[id] - Get single project with all relations
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        expenses: true,
        transactions: true,
        materialsUsed: true,
        laborRecords: {
          include: {
            employee: { select: { id: true, fullName: true } },
          }
        },
        documents: true,
        payments: true,
        members: { select: { id: true, fullName: true, email: true, role: true } },
        tasks: true,
        company: { select: { id: true, name: true } },
      },
    });
    if (!project || project.companyId !== companyId) {
      return NextResponse.json({ message: 'Mashruuca lama helin.' }, { status: 404 });
    }
    // Map laborRecords to include employeeName for frontend convenience
    const mappedProject = project ? {
      ...project,
      laborRecords: Array.isArray(project.laborRecords) ? project.laborRecords.map((lr: any) => ({
        ...lr,
        employeeName: lr.employee?.fullName || lr.employeeName || 'Unknown',
      })) : [],
    } : null;

    return NextResponse.json({ project: mappedProject }, { status: 200 });
  } catch (error) {
    console.error('Cilad ayaa dhacday marka mashruuca la helayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    console.log('Project edit API called for ID:', id);
    
    const companyId = await getSessionCompanyId();
    console.log('Company ID:', companyId);
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate required fields
    if (!body.name || !body.agreementAmount || !body.customerId) {
      return NextResponse.json({ 
        message: 'Fadlan buuxi dhammaan beeraha waajibka ah: name, agreementAmount, customerId.' 
      }, { status: 400 });
    }
    
    // Verify project exists and belongs to company
    const existingProject = await prisma.project.findFirst({
      where: { id, companyId }
    });
    
    if (!existingProject) {
      console.log('Project not found or does not belong to company');
      return NextResponse.json({ message: 'Mashruuca lama helin.' }, { status: 404 });
    }

    // Calculate remaining amount with proper validation
    const agreementAmount = parseFloat(body.agreementAmount);
    const advancePaid = parseFloat(body.advancePaid || 0);
    
    if (isNaN(agreementAmount) || isNaN(advancePaid)) {
      return NextResponse.json({ 
        message: 'Qiimaha lacagta ma sax ah.' 
      }, { status: 400 });
    }
    
    const remainingAmount = agreementAmount - advancePaid;
    console.log('Calculated remaining amount:', remainingAmount);

    // Prepare update data with proper validation
    const updateData: any = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      agreementAmount: agreementAmount,
      advancePaid: advancePaid,
      remainingAmount: remainingAmount,
      projectType: body.projectType?.trim() || null,
      status: body.status || 'Active',
      notes: body.notes?.trim() || null,
      customerId: body.customerId,
    };

    // Handle dates properly
    if (body.expectedCompletionDate) {
      updateData.expectedCompletionDate = new Date(body.expectedCompletionDate);
    }
    if (body.actualCompletionDate) {
      updateData.actualCompletionDate = new Date(body.actualCompletionDate);
    }

    console.log('Update data:', updateData);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        company: { select: { id: true, name: true } },
      },
    });

    console.log('Project updated successfully:', updatedProject.id);

    // Notify about project update for real-time updates
    const projectEvent = {
      id: updatedProject.id,
      action: 'updated',
      timestamp: Date.now()
    };

    return NextResponse.json(
      { message: 'Mashruuca si guul leh ayaa la cusboonaysiiyay!', project: updatedProject, event: projectEvent },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Cilad ayaa dhacday marka mashruuca la cusboonaysiinayay:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });
    
    // Return more specific error messages
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        message: 'Mashruucan horay u jiraa.' 
      }, { status: 400 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        message: 'Mashruuca lama helin.' 
      }, { status: 404 });
    }
    
    return NextResponse.json(
      { 
        message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const companyId = await getSessionCompanyId();
    
    // Verify project exists and belongs to company
    const existingProject = await prisma.project.findFirst({
      where: { id, companyId }
    });
    
    if (!existingProject) {
      return NextResponse.json({ message: 'Mashruuca lama helin.' }, { status: 404 });
    }

    // Manual cascade delete - delete related records first
    // 1. Get all expenses for this project to refund account balances
    const projectExpenses = await prisma.expense.findMany({
      where: { projectId: id },
      select: { paidFrom: true, amount: true }
    });

    // 2. Refund account balances for all expenses
    for (const expense of projectExpenses) {
      if (expense.paidFrom && expense.amount) {
        await prisma.account.update({
          where: { id: expense.paidFrom },
          data: {
            balance: { increment: Number(expense.amount) }, // Soo celi lacagta
          },
        });
      }
    }

    // 3. Get all project labor records for this project to refund account balances
    const projectLabors = await prisma.projectLabor.findMany({
      where: { projectId: id },
      select: { paidFrom: true, paidAmount: true }
    });

    // 4. Refund account balances for all project labor records
    for (const labor of projectLabors) {
      if (labor.paidFrom && labor.paidAmount) {
        await prisma.account.update({
          where: { id: labor.paidFrom },
          data: {
            balance: { increment: Number(labor.paidAmount) }, // Soo celi lacagta
          },
        });
      }
    }

    // 5. Delete related project labor records
    await prisma.projectLabor.deleteMany({
      where: { projectId: id }
    });

    // 6. Delete related transactions
    await prisma.transaction.deleteMany({
      where: { projectId: id }
    });

    // 7. Delete related expenses
    await prisma.expense.deleteMany({
      where: { projectId: id }
    });

    // 8. Delete the project
    await prisma.project.delete({
      where: { id }
    });

    // Notify about project deletion for real-time updates
    const projectEvent = {
      id: id,
      action: 'deleted',
      timestamp: Date.now()
    };

    return NextResponse.json(
      { message: 'Mashruuca si guul leh ayaa loo tirtiray!', event: projectEvent },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cilad ayaa dhacday marka mashruuca la tirtirayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}