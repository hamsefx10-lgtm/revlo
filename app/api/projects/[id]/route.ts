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
        laborRecords: true,
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
    return NextResponse.json({ project }, { status: 200 });
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

    return NextResponse.json(
      { message: 'Mashruuca si guul leh ayaa la cusboonaysiiyay!', project: updatedProject },
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

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: 'Mashruuca si guul leh ayaa loo tirtiray!' },
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