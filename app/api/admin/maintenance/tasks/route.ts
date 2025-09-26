import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate maintenance tasks (in a real app, these would come from the database)
    const tasks = [
      {
        id: 'task-1',
        name: 'Database Optimization',
        description: 'Optimize database tables and indexes for better performance',
        type: 'database',
        status: 'pending',
        priority: 'high',
        estimatedDuration: 45,
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        progress: 0,
        autoRun: true,
        schedule: '0 2 * * 0' // Weekly on Sunday at 2 AM
      },
      {
        id: 'task-2',
        name: 'Cache Cleanup',
        description: 'Clear expired cache entries and optimize cache storage',
        type: 'cache',
        status: 'completed',
        priority: 'medium',
        estimatedDuration: 15,
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        nextRun: new Date(Date.now() + 22 * 60 * 60 * 1000), // Tomorrow
        progress: 100,
        autoRun: true,
        schedule: '0 */6 * * *' // Every 6 hours
      },
      {
        id: 'task-3',
        name: 'Storage Cleanup',
        description: 'Remove temporary files and optimize storage usage',
        type: 'storage',
        status: 'running',
        priority: 'medium',
        estimatedDuration: 30,
        lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        progress: 65,
        autoRun: true,
        schedule: '0 1 * * *' // Daily at 1 AM
      },
      {
        id: 'task-4',
        name: 'Security Scan',
        description: 'Perform comprehensive security vulnerability scan',
        type: 'security',
        status: 'failed',
        priority: 'critical',
        estimatedDuration: 60,
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        progress: 0,
        autoRun: true,
        schedule: '0 3 * * 1' // Weekly on Monday at 3 AM
      },
      {
        id: 'task-5',
        name: 'Performance Analysis',
        description: 'Analyze system performance metrics and generate report',
        type: 'performance',
        status: 'pending',
        priority: 'low',
        estimatedDuration: 20,
        lastRun: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
        nextRun: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        progress: 0,
        autoRun: true,
        schedule: '0 4 * * 1' // Weekly on Monday at 4 AM
      },
      {
        id: 'task-6',
        name: 'Backup Verification',
        description: 'Verify backup integrity and test restore procedures',
        type: 'backup',
        status: 'completed',
        priority: 'high',
        estimatedDuration: 25,
        lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        nextRun: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // Next week
        progress: 100,
        autoRun: true,
        schedule: '0 5 * * 1' // Weekly on Monday at 5 AM
      }
    ];

    return NextResponse.json({ 
      success: true, 
      tasks,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching maintenance tasks:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch maintenance tasks', error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const companyId = await getSessionCompanyId();
    const body = await request.json();
    
    const { name, description, type, priority, estimatedDuration, autoRun, schedule } = body;

    if (!name || !type || !priority) {
      return NextResponse.json(
        { success: false, message: 'Name, type, and priority are required' },
        { status: 400 }
      );
    }

    // Simulate task creation (in a real app, this would save to the database)
    const newTask = {
      id: `task-${Date.now()}`,
      name,
      description: description || '',
      type,
      status: 'pending',
      priority,
      estimatedDuration: estimatedDuration || 30,
      lastRun: undefined,
      nextRun: autoRun ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
      progress: 0,
      autoRun: autoRun || false,
      schedule: schedule || ''
    };

    console.log(`Creating maintenance task: ${name} for company ${companyId}`);

    return NextResponse.json({
      success: true,
      message: 'Maintenance task created successfully',
      task: newTask
    });

  } catch (error: any) {
    console.error('Error creating maintenance task:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create maintenance task', error: error.message },
      { status: 500 }
    );
  }
}
