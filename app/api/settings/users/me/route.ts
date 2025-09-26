import { NextResponse } from 'next/server';
import prisma from '@/lib/db';


export async function GET() {
  try {
    // Get current user session
    // (If you have a custom getCurrentUser, use that instead)
    // If getServerSession is not available, fallback to mock user for now
    // TODO: Replace with real session user ID
    // For now, fetch the first user (for demo/testing only)
    const user = await prisma.user.findFirst({});
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    const userId = user.id;

    // Fetch user profile
    const userProfile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        companyId: true,
        createdAt: true,
        lastLogin: true,
        company: { select: { name: true } },
      },
    });
    if (!userProfile) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Count projects and expenses for this user
    const [projectsCount, expensesCount] = await Promise.all([
      prisma.project.count({ where: { members: { some: { id: userId } } } }),
      prisma.expense.count({ where: { userId } }),
    ]);

    // Compose profile
    const profile = {
      id: userProfile.id,
      name: userProfile.fullName,
      email: userProfile.email,
      phone: userProfile.phone,
      role: userProfile.role,
      companyId: userProfile.companyId,
      companyName: userProfile.company?.name || '',
      createdAt: userProfile.createdAt,
      lastLogin: userProfile.lastLogin,
      projectsCount,
      expensesCount,
      avatarChar: userProfile.fullName ? userProfile.fullName[0] : '?',
    };

    return NextResponse.json({ user: profile });
  } catch (error: any) {
    return NextResponse.json({ message: error?.message || 'Failed to fetch user profile' }, { status: 500 });
  }
}
