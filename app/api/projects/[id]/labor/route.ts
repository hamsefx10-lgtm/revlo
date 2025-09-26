// app/api/projects/[id]/labor/route.ts - Add Project Employee (ProjectLabor)
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/employees/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    const { id: projectId } = params;
    const { employeeName, workDescription, agreedWage, dateWorked } = await request.json();
    if (!employeeName || !workDescription || !agreedWage || !dateWorked) {
      return NextResponse.json({ message: 'Fadlan buuxi dhammaan beeraha waajibka ah.' }, { status: 400 });
    }
    // Create ProjectLabor record (no paidAmount, no double fields)
    const labor = await prisma.projectLabor.create({
      data: {
        employeeName,
        workDescription,
        agreedWage,
        paidAmount: 0,
        remainingWage: agreedWage,
        dateWorked: new Date(dateWorked),
        projectId,
        // employeeId: null, // Optionally link to Employee if needed
      },
    });
    return NextResponse.json({ message: 'Shaqaale mashruuc si guul leh ayaa loo daray!', labor }, { status: 201 });
  } catch (error) {
    console.error('Error in add project labor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
