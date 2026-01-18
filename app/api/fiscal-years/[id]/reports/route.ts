import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { getFiscalYearSummary } from '@/lib/fiscal-year-service';

// GET - Get fiscal year reports and summary
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = (await getServerSession(authOptions)) as import('next-auth').Session | null;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fiscalYearId = params.id;

    // Get fiscal year summary
    const summary = await getFiscalYearSummary(fiscalYearId, session.user.companyId);

    // Get detailed reports
    const reports = {
      // Income Statement
      incomeStatement: {
        revenue: await prisma.transaction.findMany({
          where: {
            fiscalYearId: fiscalYearId,
            companyId: session.user.companyId,
            type: 'INCOME',
          },
          include: {
            account: true,
            project: true,
            customer: true,
          },
        }),
        expenses: await prisma.transaction.findMany({
          where: {
            fiscalYearId: fiscalYearId,
            companyId: session.user.companyId,
            type: 'EXPENSE',
          },
          include: {
            account: true,
            project: true,
            // vendor: true,
          },
        }),
      },

      // Balance Sheet
      balanceSheet: {
        assets: await prisma.account.findMany({
          where: {
            companyId: session.user.companyId,
            type: { in: ['ASSET', 'CURRENT_ASSET', 'FIXED_ASSET'] },
          },
        }),
        liabilities: await prisma.account.findMany({
          where: {
            companyId: session.user.companyId,
            type: { in: ['LIABILITY', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY'] },
          },
        }),
        equity: await prisma.account.findMany({
          where: {
            companyId: session.user.companyId,
            type: 'EQUITY',
          },
        }),
      },

      // Cash Flow
      cashFlow: {
        operating: await prisma.transaction.findMany({
          where: {
            fiscalYearId: fiscalYearId,
            companyId: session.user.companyId,
            type: { in: ['INCOME', 'EXPENSE'] },
          },
          include: {
            account: true,
          },
        }),
        investing: await prisma.transaction.findMany({
          where: {
            fiscalYearId: fiscalYearId,
            companyId: session.user.companyId,
            type: { in: ['TRANSFER_IN', 'TRANSFER_OUT'] },
          },
          include: {
            account: true,
          },
        }),
      },

      // Project Performance
      projectPerformance: await prisma.project.findMany({
        where: {
          fiscalYearId: fiscalYearId,
          companyId: session.user.companyId,
        },
        include: {
          customer: true,
          expenses: true,
          transactions: true,
          payments: true,
        },
      }),
    };

    return NextResponse.json({
      summary,
      reports,
    });
  } catch (error) {
    console.error('Error fetching fiscal year reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fiscal year reports' },
      { status: 500 }
    );
  }
}

