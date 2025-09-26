// app/api/employees/project-labor.ts - Returns all project employees (ProjectLabor) for the company
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyId } from '@/app/api/employees/auth';

export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    // Get all projects for this company
    const projects = await prisma.project.findMany({
      where: { companyId },
      select: { id: true, name: true },
    });
  const projectIds = projects.map((p: any) => p.id);
    // Get all ProjectLabor records for these projects
    const projectLabors = await prisma.projectLabor.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        employee: true,
        project: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ projectLabors }, { status: 200 });
  } catch (error) {
    console.error('Error in project-labor:', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
