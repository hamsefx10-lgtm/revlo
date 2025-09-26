import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    const { id } = params;
    const { status } = await request.json();

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be active, inactive, or suspended' },
        { status: 400 }
      );
    }

    // Simulate updating user status (in a real app, this would update the database)
    console.log(`Updating user ${id} status to ${status} for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: `User status updated to ${status}`,
      userId: id,
      newStatus: status
    });

  } catch (error: any) {
    console.error('Error updating user status:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update user status', 
        error: error.message
      },
      { status: 500 }
    );
  }
}
