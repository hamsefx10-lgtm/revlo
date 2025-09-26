import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '../../admin/auth';
import prisma from '@/lib/db';

// GET /api/settings/personalization - Get personalization settings
export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let settings = await prisma.personalizationSettings.findFirst({
      where: { companyId },
    });

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.personalizationSettings.create({
        data: {
          companyId,
          theme: 'system',
          language: 'so',
          defaultHomePage: '/dashboard',
          currency: 'ETB',
          dateFormat: 'DD/MM/YYYY',
          tableDensity: 'comfortable',
          avatarColor: '#3498DB',
          customFont: 'Inter',
          notificationSound: 'default',
          highContrast: false,
          textSize: 'medium',
          defaultExportFormat: 'CSV',
          notifications: {
            email: true,
            inApp: true,
            sms: false,
            lowStock: true,
            overdueProjects: true,
          },
        },
      });
    }

    return NextResponse.json({ 
      settings,
      message: 'Personalization settings retrieved successfully' 
    });
  } catch (error) {
    console.error('Error fetching personalization settings:', error);
    return NextResponse.json(
      { message: 'Failed to fetch personalization settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings/personalization - Update personalization settings
export async function PUT(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    if (!companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const settingsData = await request.json();

    const settings = await prisma.personalizationSettings.upsert({
      where: { companyId },
      update: settingsData,
      create: {
        companyId,
        ...settingsData,
      },
    });

    return NextResponse.json({ 
      settings,
      message: 'Personalization settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating personalization settings:', error);
    return NextResponse.json(
      { message: 'Failed to update personalization settings' },
      { status: 500 }
    );
  }
}

