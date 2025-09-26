import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate performance metrics (in a real app, these would come from monitoring tools)
    const metrics = [
      {
        id: 'api-response-time',
        name: 'API Response Time',
        value: Math.floor(Math.random() * 200) + 50, // 50-250ms
        unit: 'ms',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.floor(Math.random() * 20) - 10, // -10% to +10%
        status: Math.random() > 0.8 ? 'warning' : 'good',
        timestamp: new Date()
      },
      {
        id: 'database-connections',
        name: 'Database Connections',
        value: Math.floor(Math.random() * 50) + 10, // 10-60
        unit: 'connections',
        trend: Math.random() > 0.5 ? 'up' : 'stable',
        change: Math.floor(Math.random() * 15) - 5, // -5% to +10%
        status: 'good',
        timestamp: new Date()
      },
      {
        id: 'memory-usage',
        name: 'Memory Usage',
        value: Math.floor(Math.random() * 40) + 30, // 30-70%
        unit: '%',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.floor(Math.random() * 10) - 5, // -5% to +5%
        status: Math.random() > 0.7 ? 'warning' : 'good',
        timestamp: new Date()
      },
      {
        id: 'active-users',
        name: 'Active Users',
        value: Math.floor(Math.random() * 100) + 20, // 20-120
        unit: 'users',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.floor(Math.random() * 25) - 10, // -10% to +15%
        status: 'good',
        timestamp: new Date()
      },
      {
        id: 'error-rate',
        name: 'Error Rate',
        value: Math.floor(Math.random() * 5) + 1, // 1-5%
        unit: '%',
        trend: Math.random() > 0.5 ? 'up' : 'down',
        change: Math.floor(Math.random() * 3) - 1, // -1% to +2%
        status: Math.random() > 0.8 ? 'critical' : Math.random() > 0.5 ? 'warning' : 'good',
        timestamp: new Date()
      },
      {
        id: 'cache-hit-rate',
        name: 'Cache Hit Rate',
        value: Math.floor(Math.random() * 20) + 75, // 75-95%
        unit: '%',
        trend: Math.random() > 0.5 ? 'up' : 'stable',
        change: Math.floor(Math.random() * 5) - 2, // -2% to +3%
        status: 'good',
        timestamp: new Date()
      }
    ];

    return NextResponse.json({ 
      success: true, 
      metrics,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching performance metrics:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch performance metrics', error: error.message },
      { status: 500 }
    );
  }
}

