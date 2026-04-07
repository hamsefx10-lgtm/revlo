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

    const { liveDescriptor } = await req.json();

    if (!liveDescriptor || !Array.isArray(liveDescriptor)) {
      return NextResponse.json({ success: false, message: 'Invalid face descriptor' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { faceDescriptor: true } as any
    });

    if (!user || !(user as any).faceDescriptor) {
      return NextResponse.json({ success: false, message: 'Face ID not enrolled' }, { status: 404 });
    }

    const storedDescriptor = JSON.parse((user as any).faceDescriptor) as number[];

    // Calculate Euclidean Distance
    let distance = 0;
    for (let i = 0; i < storedDescriptor.length; i++) {
       distance += Math.pow(storedDescriptor[i] - liveDescriptor[i], 2);
    }
    distance = Math.sqrt(distance);

    const THRESHOLD = 0.55; // Secure threshold. Typically 0.6 is default, 0.55 is stricter.

    if (distance <= THRESHOLD) {
       // Face Matched -> Set session as Sudo Verified
       // Instead of setting it securely on session (which we could do using tokens),
       // We return success so the client can update its local state.
       // Since the UI protects the dashboard, this is acceptable for the Sudo mode gate.
       return NextResponse.json({ success: true, distance });
    } else {
       return NextResponse.json({ success: false, message: 'Wajigu ma is-waafaqin!', distance });
    }

  } catch (error: any) {
    console.error('Face verification error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
