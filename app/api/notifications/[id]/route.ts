import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../admin/auth';
import prisma from '@/lib/db';

// PUT /api/notifications/[id] - Mark notification as read/unread
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { read } = await request.json();

    const notification = await prisma.notification.update({
      where: { 
        id: params.id,
        companyId 
      },
      data: { read },
    });

    return NextResponse.json({
      notification,
      message: 'Notification updated successfully',
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { message: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.delete({
      where: { 
        id: params.id,
        companyId 
      },
    });

    return NextResponse.json({
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { message: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
