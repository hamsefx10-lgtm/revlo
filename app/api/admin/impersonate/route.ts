import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = session?.user?.id;
    const adminRole = (session?.user as any)?.role;

    if (!adminId || adminRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'Target user ID is required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Generate a secure, short-lived token
    const tokenStr = require('crypto').randomBytes(32).toString('hex');
    const identifier = `impersonate:${targetUserId}:${adminId}`;

    // Clear old tokens for this specific impersonation path just in case
    await prisma.verificationToken.deleteMany({
      where: { identifier }
    });

    await prisma.verificationToken.create({
      data: {
        identifier,
        token: tokenStr,
        expires: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes expiration
      }
    });

    return NextResponse.json({ success: true, token: tokenStr });

  } catch (error: any) {
    console.error('Error generating impersonate token:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
