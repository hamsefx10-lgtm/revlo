import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// GET - Fetch all fiscal years for the company
export async function GET(request: NextRequest) {
  try {
  const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fiscalYears = await prisma.fiscalYear.findMany({
      where: {
        companyId: session.user.companyId,
      },
      orderBy: {
        year: 'desc',
      },
    });

    return NextResponse.json(fiscalYears);
  } catch (error) {
    console.error('Error fetching fiscal years:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fiscal years' },
      { status: 500 }
    );
  }
}

// POST - Create a new fiscal year
export async function POST(request: NextRequest) {
  try {
  const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { year, startDate, endDate, description } = body;

    // Validate required fields
    if (!year || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Year, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Check if fiscal year already exists
    const existingFiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        year: parseInt(year),
        companyId: session.user.companyId,
      },
    });

    if (existingFiscalYear) {
      return NextResponse.json(
        { error: 'Fiscal year already exists' },
        { status: 400 }
      );
    }

    // Create new fiscal year
    const fiscalYear = await prisma.fiscalYear.create({
      data: {
        year: parseInt(year),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        description,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json(fiscalYear, { status: 201 });
  } catch (error) {
    console.error('Error creating fiscal year:', error);
    return NextResponse.json(
      { error: 'Failed to create fiscal year' },
      { status: 500 }
    );
  }
}

