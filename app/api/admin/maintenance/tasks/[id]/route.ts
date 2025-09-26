import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;

    // Simulate task deletion (in a real app, this would delete from the database)
    console.log(`Deleting maintenance task ${id} for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: `Maintenance task ${id} has been deleted`
    });

  } catch (error: any) {
    console.error('Error deleting maintenance task:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete maintenance task', 
        error: error.message
      },
      { status: 500 }
    );
  }
}
