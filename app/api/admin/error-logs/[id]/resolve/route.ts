import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;

    // In a real app, this would update the error log in the database
    // For now, we'll simulate a successful resolution
    console.log(`Resolving error log ${id} for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: `Error log ${id} has been resolved`,
      resolvedAt: new Date(),
      resolvedBy: 'admin@company.com'
    });

  } catch (error: any) {
    console.error('Error resolving error log:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to resolve error log', 
        error: error.message
      },
      { status: 500 }
    );
  }
}
