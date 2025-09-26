import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../admin/auth';
import prisma from '@/lib/db';

// GET /api/notifications - Get all notifications
export async function GET(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type');
    const readStatus = searchParams.get('readStatus');

    // Build where clause
    const where: any = { companyId };
    
    if (type && type !== 'All') {
      where.type = type;
    }
    
    if (readStatus && readStatus !== 'All') {
      where.read = readStatus === 'Read';
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ]);

    const unreadCount = await prisma.notification.count({
      where: { ...where, read: false },
    });

    return NextResponse.json({
      notifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      stats: {
        total,
        unread: unreadCount,
      },
      message: 'Notifications retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create new notification
export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { message, type, details, userId, userDisplayName } = await request.json();

    if (!message || !type) {
      return NextResponse.json(
        { message: 'Message and type are required' },
        { status: 400 }
      );
    }

    const notification = await prisma.notification.create({
      data: {
        message,
        type,
        details: details || '',
        userDisplayName: userDisplayName || null,
        userId: userId || null,
        companyId,
        read: false,
      },
    });

    return NextResponse.json({
      notification,
      message: 'Notification created successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { message: 'Failed to create notification' },
      { status: 500 }
    );
  }
}