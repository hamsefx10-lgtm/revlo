import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSessionCompanyUser();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const chats = await prisma.telegramChat.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        defaultProject: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ chats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching telegram chats', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionCompanyUser();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { chatId, chatName, chatType, defaultProjectId, active = true } = body;

    if (!chatId) {
      return NextResponse.json({ message: 'chatId is required' }, { status: 400 });
    }

    const existing = await prisma.telegramChat.findUnique({ where: { chatId } });
    if (existing && existing.companyId !== session.companyId) {
      return NextResponse.json({ message: 'Chat already linked to another company' }, { status: 403 });
    }

    const data = {
      chatId,
      chatName,
      chatType,
      companyId: session.companyId,
      defaultProjectId: defaultProjectId || null,
      active,
    };

    const chat = existing
      ? await prisma.telegramChat.update({ where: { chatId }, data })
      : await prisma.telegramChat.create({ data });

    return NextResponse.json({ chat }, { status: 200 });
  } catch (error) {
    console.error('Error saving telegram chat', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

