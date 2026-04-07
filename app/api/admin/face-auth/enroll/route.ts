import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userRole = (session?.user as any)?.role;

    if (!userId || userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const { descriptor } = await req.json();

    if (!descriptor || !Array.isArray(descriptor)) {
      return NextResponse.json({ success: false, message: 'Invalid face descriptor' }, { status: 400 });
    }

    // Convert Float32Array array to JSON string to store in DB
    const descriptorStr = JSON.stringify(descriptor);

    await prisma.user.update({
      where: { id: userId },
      data: { faceDescriptor: descriptorStr } as any
    });

    return NextResponse.json({ success: true, message: 'Wajiga si guul leh ayaa loo diiwaangeliyay.' });

  } catch (error: any) {
    console.error('Face enroll error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
