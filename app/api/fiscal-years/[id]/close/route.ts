import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

// POST - Close a fiscal year
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fiscalYearId = params.id;

    // Find the fiscal year
    const fiscalYear = await prisma.fiscalYear.findFirst({
      where: {
        id: fiscalYearId,
        companyId: session.user.companyId,
      },
    });

    if (!fiscalYear) {
      return NextResponse.json(
        { error: 'Fiscal year not found' },
        { status: 404 }
      );
    }

    if (fiscalYear.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Fiscal year is already closed' },
        { status: 400 }
      );
    }

    // Close the fiscal year
    const updatedFiscalYear = await prisma.fiscalYear.update({
      where: {
        id: fiscalYearId,
      },
      data: {
        status: 'CLOSED',
      },
    });

    return NextResponse.json(updatedFiscalYear);
  } catch (error) {
    console.error('Error closing fiscal year:', error);
    return NextResponse.json(
      { error: 'Failed to close fiscal year' },
      { status: 500 }
    );
  }
}

