// app/api/project-labors/route.ts - Project Labor Records API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '../expenses/auth';

// GET /api/project-labors - Fetch all project labor records
export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    
    const projectLabors = await prisma.projectLabor.findMany({
      where: {
        project: {
          companyId: companyId
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            category: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { dateWorked: 'desc' },
    });

    // Transform to frontend format
    const transformedLabors = projectLabors.map(labor => ({
      id: labor.id,
      employeeId: labor.employeeId,
      projectId: labor.projectId,
      agreedWage: typeof labor.agreedWage === 'object' && 'toNumber' in labor.agreedWage ? labor.agreedWage.toNumber() : Number(labor.agreedWage),
      paidAmount: typeof labor.paidAmount === 'object' && 'toNumber' in labor.paidAmount ? labor.paidAmount.toNumber() : Number(labor.paidAmount),
      remainingWage: typeof labor.remainingWage === 'object' && 'toNumber' in labor.remainingWage ? labor.remainingWage.toNumber() : Number(labor.remainingWage),
      description: labor.description,
      dateWorked: labor.dateWorked,
      projectName: labor.projectName,
      employeeName: labor.employee?.fullName || 'Unknown Employee',
      workDescription: labor.workDescription,
    }));

    return NextResponse.json({ projectLabors: transformedLabors }, { status: 200 });
  } catch (error) {
    console.error('Error fetching project labors:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
