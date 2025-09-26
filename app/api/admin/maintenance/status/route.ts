import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate system status (in a real app, these would come from system monitoring)
    const status = {
      database: {
        status: 'healthy' as const,
        connections: Math.floor(Math.random() * 20) + 10, // 10-30
        maxConnections: 100,
        queryTime: Math.floor(Math.random() * 50) + 30, // 30-80ms
        lastBackup: new Date(Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000) // 0-24 hours ago
      },
      cache: {
        status: Math.random() > 0.7 ? 'warning' as const : 'healthy' as const,
        hitRate: Math.floor(Math.random() * 20) + 75, // 75-95%
        memoryUsage: Math.floor(Math.random() * 30) + 60, // 60-90%
        maxMemory: 100,
        lastClear: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // 0-7 days ago
      },
      storage: {
        status: 'healthy' as const,
        used: Math.floor(Math.random() * 20) + 50, // 50-70%
        total: 100,
        free: Math.floor(Math.random() * 20) + 30, // 30-50%
        lastCleanup: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000) // 0-7 days ago
      },
      performance: {
        status: 'healthy' as const,
        cpuUsage: Math.floor(Math.random() * 30) + 30, // 30-60%
        memoryUsage: Math.floor(Math.random() * 20) + 50, // 50-70%
        responseTime: Math.floor(Math.random() * 100) + 80, // 80-180ms
        lastOptimization: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000) // 0-14 days ago
      }
    };

    return NextResponse.json({ 
      success: true, 
      status,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching system status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch system status', error: error.message },
      { status: 500 }
    );
  }
}
