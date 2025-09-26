// app/api/notifications/seed/route.ts - Seed Notifications for Testing
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

// POST /api/notifications/seed - Create sample notifications for testing
export async function POST(request: Request) {
  try {
    const { companyId } = await getSessionCompanyUser();
    
    // Sample notifications data
    const sampleNotifications = [
      {
        message: 'Mashruuca "Furniture Project A" wuu dib u dhacay!',
        type: 'Overdue Project',
        details: 'Deadline-kii wuu dhaafay 3 maalmood.',
        read: false,
      },
      {
        message: 'Alaabta "Screws" stock-geedu waa yar yahay.',
        type: 'Low Stock',
        details: 'Kaliya 30 sanduuq ayaa hadhay, min-stock waa 50.',
        read: false,
      },
      {
        message: 'Lacag cusub ayaa la diiwaan geliyay: $5000.',
        type: 'New Payment',
        details: 'Lacagta mashruuca "Office Setup B" ayaa la helay.',
        read: true,
      },
      {
        message: 'User cusub "Cali Xasan" ayaa isku diiwaan geliyay.',
        type: 'User Activity',
        details: 'Email: cali.h@example.com, Role: Member.',
        user: 'Cali Xasan',
        read: true,
      },
      {
        message: 'Kharash cusub "Fuel for Vehicle A" ayaa la diiwaan geliyay.',
        type: 'New Expense',
        details: 'Qiimaha: $500, Gaariga: Vehicle A.',
        read: false,
      },
      {
        message: 'User "Faadumo Maxamed" ayaa wax ka beddelay profile-keeda.',
        type: 'User Activity',
        details: 'Beddelka: Email-ka ayaa la cusboonaysiiyay.',
        user: 'Faadumo Maxamed',
        read: true,
      },
      {
        message: 'Account "Ebirr Account" ayaa la cusboonaysiiyay.',
        type: 'System Activity',
        details: 'Balance-ka cusub: $12,500.',
        read: false,
      },
      {
        message: 'Hantida "CNC Machine" ayaa la meelayay "Factory".',
        type: 'System Activity',
        details: 'Meelaynta hore: Office.',
        read: false,
      },
      {
        message: 'Mashruuca "Website Development" wuu dhammaaday!',
        type: 'Project Completed',
        details: 'Lacagta dhammaadka: $25,000.',
        read: true,
      },
      {
        message: 'Alaabta "Laptops" waa la soo saaray.',
        type: 'Inventory Update',
        details: '10 units cusub ayaa la soo saaray.',
        read: false,
      },
    ];

    // Create notifications in database
    const createdNotifications = await Promise.all(
      sampleNotifications.map(notification =>
        prisma.notification.create({
          data: {
            ...notification,
            companyId,
          },
        })
      )
    );

    return NextResponse.json(
      { 
        message: `${createdNotifications.length} digniin cusub ayaa la abuuray!`, 
        notifications: createdNotifications 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Cilad ayaa dhacday marka digniinaha la abuuraynayay:', error);
    return NextResponse.json(
      { message: 'Cilad server ayaa dhacday. Fadlan isku day mar kale.' },
      { status: 500 }
    );
  }
}
