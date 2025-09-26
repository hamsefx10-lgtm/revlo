import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;

    // Simulate backup deletion (in a real app, this would delete the actual backup file)
    console.log(`Deleting backup ${id} for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: `Backup ${id} has been deleted`
    });

  } catch (error: any) {
    console.error('Error deleting backup:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete backup', 
        error: error.message
      },
      { status: 500 }
    );
  }
}
