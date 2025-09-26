import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate system health metrics (in a real app, these would come from system monitoring)
    const health = {
      cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory: Math.floor(Math.random() * 40) + 30, // 30-70%
      disk: Math.floor(Math.random() * 20) + 40, // 40-60%
      network: Math.floor(Math.random() * 25) + 15, // 15-40%
      database: Math.floor(Math.random() * 20) + 10, // 10-30%
      api: Math.floor(Math.random() * 100) + 50 // 50-150ms
    };

    return NextResponse.json({ 
      success: true, 
      health,
      timestamp: new Date(),
      status: 'healthy'
    });

  } catch (error: any) {
    console.error('Error fetching system health:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch system health', error: error.message },
      { status: 500 }
    );
  }
}

