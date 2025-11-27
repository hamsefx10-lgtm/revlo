import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionCompanyUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getSessionCompanyUser();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;
    const existing = await prisma.telegramChat.findUnique({ where: { chatId } });
    if (!existing || existing.companyId !== session.companyId) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    const body = await request.json();
    const data: any = {};
    if (body.chatName !== undefined) data.chatName = body.chatName;
    if (body.chatType !== undefined) data.chatType = body.chatType;
    if (body.defaultProjectId !== undefined) data.defaultProjectId = body.defaultProjectId || null;
    if (body.active !== undefined) data.active = body.active;

    const chat = await prisma.telegramChat.update({
      where: { chatId },
      data,
    });

    return NextResponse.json({ chat }, { status: 200 });
  } catch (error) {
    console.error('Error updating telegram chat', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getSessionCompanyUser();
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { chatId } = params;
    const existing = await prisma.telegramChat.findUnique({ where: { chatId } });
    if (!existing || existing.companyId !== session.companyId) {
      return NextResponse.json({ message: 'Chat not found' }, { status: 404 });
    }

    await prisma.telegramChat.delete({ where: { chatId } });
    return NextResponse.json({ message: 'Deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting telegram chat', error);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

