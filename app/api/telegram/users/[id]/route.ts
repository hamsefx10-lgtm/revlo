import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionCompanyUser();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const link = await prisma.telegramUserLink.findUnique({ where: { id } });
    if (!link || link.companyId !== session.companyId) {
      return NextResponse.json({ message: 'User link not found' }, { status: 404 });
    }

    const body = await request.json();
    const data: any = {};
    if (body.status) data.status = body.status;
    if (body.userId !== undefined) data.userId = body.userId || null;

    const updated = await prisma.telegramUserLink.update({
      where: { id },
      data,
    });

    return NextResponse.json({ user: updated }, { status: 200 });
  } catch (error) {
    console.error('Error updating telegram user link', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

