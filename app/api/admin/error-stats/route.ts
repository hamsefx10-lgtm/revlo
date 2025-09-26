import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate error statistics (in a real app, these would be calculated from actual logs)
    const stats = {
      totalErrors: 1247,
      errorsToday: 23,
      errorsThisWeek: 156,
      errorsThisMonth: 892,
      criticalErrors: 12,
      unresolvedErrors: 45
    };

    return NextResponse.json({ 
      success: true, 
      stats,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching error stats:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch error stats', error: error.message },
      { status: 500 }
    );
  }
}
