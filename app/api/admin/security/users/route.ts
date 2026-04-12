import { NextResponse } from 'next/server';
import { getSessionCompanyId } from '@/app/api/admin/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companyId = await getSessionCompanyId();
    
    // Fetch REAL users from the database, since this is Super Admin, we could get all users or just the current company's users.
    // If SuperAdmin, they should probably see all users across all companies, but let's try just getting all users and mapping them
    const realUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
         id: true,
         fullName: true,
         email: true,
         role: true,
         status: true,
         lastLogin: true,
         createdAt: true,
      }
    });

    const transformedUsers = realUsers.map(u => ({
      id: u.id,
      name: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status.toLowerCase(), // active, inactive, suspended
      lastLogin: u.lastLogin || u.createdAt,
      loginCount: 0, // We can track this later, placeholder 0 for now
      permissions: ['read', 'write'], 
      createdAt: u.createdAt
    }));

    return NextResponse.json({ 
      success: true, 
      users: transformedUsers,
      timestamp: new Date()
    });

  } catch (error: any) {
    console.error('Error fetching real users:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users', error: error.message },
      { status: 500 }
    );
  }
}
