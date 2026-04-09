import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/projects/accounting/fixed-assets/auth'; 

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const job = await prisma.workshopJob.findUnique({
      where: { id: params.id, companyId },
      include: {
        customer: { select: { name: true } },
        project: { select: { name: true } },
        systemExpenses: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!job) return NextResponse.json({ message: 'Job not found' }, { status: 404 });

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error fetching workshop job:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { status } = body;

    const job = await prisma.workshopJob.update({
      where: { id: params.id, companyId },
      data: { 
        status,
        ...(status === 'COMPLETED' ? { completionDate: new Date() } : {})
      }
    });

    return NextResponse.json({ message: 'Job updated', job });
  } catch (error) {
    console.error('Error updating workshop job:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
