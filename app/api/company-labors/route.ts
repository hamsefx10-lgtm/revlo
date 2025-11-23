// app/api/company-labors/route.ts - Company Labor Records API
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '../expenses/auth';

// GET /api/company-labors - Fetch all company labor records
export async function GET(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    
    const companyLabors = await prisma.companyLabor.findMany({
      where: {
        companyId: companyId
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            category: true,
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

    const transformedLabors = companyLabors.map(labor => ({
      id: labor.id,
      employeeId: labor.employeeId,
      agreedWage: toNumeric(labor.agreedWage),
      paidAmount: toNumeric(labor.paidAmount),
      remainingWage: toNumeric(labor.remainingWage),
      description: labor.description || '',
      dateWorked: labor.dateWorked,
      employeeName: labor.employee?.fullName || 'Unknown Employee',
      workDescription: labor.description || '',
    }));

    return NextResponse.json({ companyLabors: transformedLabors }, { status: 200 });
  } catch (error) {
    console.error('Error fetching company labors:', error);
    return NextResponse.json(
      { message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

