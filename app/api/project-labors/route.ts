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

    // Transform to frontend format with safe Decimal/null handling
    const toNumeric = (v: any): number => {
      if (v == null) return 0;
      if (typeof v === 'object' && 'toNumber' in v && typeof v.toNumber === 'function') {
        try { return v.toNumber(); } catch { return Number(v as any) || 0; }
      }
      const n = Number(v);
      return isNaN(n) ? 0 : n;
    };

    const transformedLabors = projectLabors.map(labor => ({
      id: labor.id,
      employeeId: labor.employeeId,
      projectId: labor.projectId,
      agreedWage: toNumeric(labor.agreedWage),
      paidAmount: toNumeric(labor.paidAmount),
      remainingWage: toNumeric(labor.remainingWage),
      description: labor.description || '',
      dateWorked: labor.dateWorked,
      projectName: (labor as any).projectName || labor.project?.name || '',
      employeeName: labor.employee?.fullName || 'Unknown Employee',
      workDescription: (labor as any).workDescription || '',
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
