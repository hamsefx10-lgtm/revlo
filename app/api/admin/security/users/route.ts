import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Simulate user data (in a real app, these would come from the database)
    const users = [
      {
        id: 'user-1',
        name: 'Admin User',
        email: 'admin@company.com',
        role: 'ADMIN' as const,
        status: 'active' as const,
        lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        loginCount: 156,
        permissions: ['read', 'write', 'delete', 'admin'],
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago
      },
      {
        id: 'user-2',
        name: 'Manager User',
        email: 'manager@company.com',
        role: 'MANAGER' as const,
        status: 'active' as const,
        lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        loginCount: 89,
        permissions: ['read', 'write'],
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // 6 months ago
      },
      {
        id: 'user-3',
        name: 'Regular User',
        email: 'user@company.com',
        role: 'USER' as const,
        status: 'active' as const,
        lastLogin: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        loginCount: 45,
        permissions: ['read'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 3 months ago
      },
      {
        id: 'user-4',
        name: 'Suspended User',
        email: 'suspended@company.com',
        role: 'USER' as const,
        status: 'suspended' as const,
        lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        loginCount: 12,
        permissions: ['read'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) // 2 months ago
      },
      {
        id: 'user-5',
        name: 'Inactive User',
        email: 'inactive@company.com',
        role: 'USER' as const,
        status: 'inactive' as const,
        lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
        loginCount: 3,
        permissions: ['read'],
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days ago
      }
    ];

    return NextResponse.json({ 
      success: true, 
      users,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
}
