import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate restore jobs (in a real app, these would come from a job queue system)
    const jobs = [
      {
        id: 'restore-1',
        backupId: 'backup-1',
        status: 'completed',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        completedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
        progress: 100,
        tablesRestored: 6,
        totalTables: 6,
        recordsRestored: 15420,
        totalRecords: 15420
      },
      {
        id: 'restore-2',
        backupId: 'backup-2',
        status: 'in_progress',
        startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        progress: 65,
        tablesRestored: 4,
        totalTables: 6,
        recordsRestored: 234,
        totalRecords: 360
      },
      {
        id: 'restore-3',
        backupId: 'backup-3',
        status: 'failed',
        startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        completedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago
        progress: 25,
        tablesRestored: 1,
        totalTables: 6,
        recordsRestored: 50,
        totalRecords: 200
      }
    ];

    return NextResponse.json({ 
      success: true, 
      jobs,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching restore jobs:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch restore jobs', error: error.message },
      { status: 500 }
    );
  }
}
