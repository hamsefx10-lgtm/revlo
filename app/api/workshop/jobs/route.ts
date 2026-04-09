import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/projects/accounting/fixed-assets/auth'; // Using an existing auth helper

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const jobs = await prisma.workshopJob.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        project: { select: { name: true } }
      }
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Error fetching workshop jobs:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, projectId, customerId } = body;

    if (!name) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // Generate Job Number
    const count = await prisma.workshopJob.count({ where: { companyId } });
    const jobNumber = `JOB-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const newJob = await prisma.workshopJob.create({
      data: {
        jobNumber,
        name,
        description,
        projectId: projectId || null,
        customerId: customerId || null,
        companyId,
        status: 'IN_PROGRESS'
      }
    });

    return NextResponse.json({ message: 'Job created successfully', job: newJob }, { status: 201 });
  } catch (error) {
    console.error('Error creating workshop job:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
