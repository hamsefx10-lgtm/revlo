import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// DELETE: Clear a user's Face ID
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { faceDescriptor: null }
    });

    return NextResponse.json({ success: true, message: 'Face ID si guul leh ayaa loo nadiifiyay!' });

  } catch (error: any) {
    console.error('Clear Face ID Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
