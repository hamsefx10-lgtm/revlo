import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate security events (in a real app, these would come from audit logs)
    const events = [
      {
        id: 'event-1',
        type: 'failed_login' as const,
        description: 'Failed login attempt with invalid password',
        userId: 'user-3',
        userEmail: 'user@company.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        severity: 'medium' as const,
        status: 'resolved' as const
      },
      {
        id: 'event-2',
        type: 'permission_denied' as const,
        description: 'Access denied to admin panel',
        userId: 'user-3',
        userEmail: 'user@company.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        severity: 'low' as const,
        status: 'resolved' as const
      },
      {
        id: 'event-3',
        type: 'login' as const,
        description: 'Successful login from new IP address',
        userId: 'user-2',
        userEmail: 'manager@company.com',
        ipAddress: '203.0.113.1',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        severity: 'low' as const,
        status: 'resolved' as const
      },
      {
        id: 'event-4',
        type: 'data_access' as const,
        description: 'Bulk data export initiated',
        userId: 'user-1',
        userEmail: 'admin@company.com',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        severity: 'high' as const,
        status: 'investigating' as const
      },
      {
        id: 'event-5',
        type: 'system_change' as const,
        description: 'Security settings modified',
        userId: 'user-1',
        userEmail: 'admin@company.com',
        ipAddress: '192.168.1.50',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        severity: 'high' as const,
        status: 'resolved' as const
      },
      {
        id: 'event-6',
        type: 'failed_login' as const,
        description: 'Multiple failed login attempts detected',
        userId: 'unknown',
        userEmail: 'hacker@example.com',
        ipAddress: '203.0.113.99',
        userAgent: 'curl/7.68.0',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        severity: 'critical' as const,
        status: 'pending' as const
      },
      {
        id: 'event-7',
        type: 'logout' as const,
        description: 'User logged out',
        userId: 'user-4',
        userEmail: 'suspended@company.com',
        ipAddress: '192.168.1.75',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        severity: 'low' as const,
        status: 'resolved' as const
      },
      {
        id: 'event-8',
        type: 'permission_denied' as const,
        description: 'Attempted access to restricted customer data',
        userId: 'user-3',
        userEmail: 'user@company.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        severity: 'medium' as const,
        status: 'resolved' as const
      }
    ];

    return NextResponse.json({ 
      success: true, 
      events,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching security events:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch security events', error: error.message },
      { status: 500 }
    );
  }
}
