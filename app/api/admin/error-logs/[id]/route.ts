import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;

    // In a real app, this would delete the error log from the database
    // For now, we'll simulate a successful deletion
    console.log(`Deleting error log ${id} for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: `Error log ${id} has been deleted`
    });

  } catch (error: any) {
    console.error('Error deleting error log:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete error log', 
        error: error.message
      },
      { status: 500 }
    );
  }
}
