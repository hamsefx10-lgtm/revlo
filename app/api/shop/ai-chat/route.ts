import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// Proxy to AI Python server — dashboard expert uses this
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, companyId: true, company: { select: { name: true } } }
  });

  const body = await req.json();
  const AI_SERVER = process.env.AI_SERVER_URL || 'http://localhost:8000';

  try {
    const res = await fetch(`${AI_SERVER}/chat/simple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: body.message || '',
        sessionId: body.sessionId || 'dashboard-expert',
        companyName: user?.company?.name || 'Revlo Shop',
        companyId: user?.companyId || '',
        userId: user?.id || '',
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[AI Proxy Error]', error.message);
    return NextResponse.json({ text: 'AI server-ka hadda ma shaqaynayo. Fadlan dib u isku day.', success: false });
  }
}
