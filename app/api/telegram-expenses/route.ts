/**
 * Pending Expenses API
 * CRUD operations for pending expenses from Telegram
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// GET /api/telegram-expenses - Get all pending expenses
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, APPROVED, REJECTED

    const where: any = { companyId };
    if (status) {
      where.status = status;
    }

    const pendingExpenses = await prisma.pendingExpense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ pendingExpenses }, { status: 200 });
  } catch (error) {
    console.error('Error fetching pending expenses:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

// POST /api/telegram-expenses - Create pending expense (usually from webhook)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as any;
    if (!session?.user?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = session.user.companyId;
    const body = await request.json();

    const {
      telegramMessageId,
      telegramChatId,
      telegramSenderName,
      telegramSenderId,
      originalMessage,
      parsedData,
    } = body;

    if (!originalMessage || !parsedData) {
      return NextResponse.json(
        { error: 'Original message and parsed data are required' },
        { status: 400 }
      );
    }

    const pendingExpense = await prisma.pendingExpense.create({
      data: {
        telegramMessageId,
        telegramChatId,
        telegramSenderName,
        telegramSenderId,
        originalMessage,
        parsedData,
        status: 'PENDING',
        companyId,
      },
    });

    return NextResponse.json({ pendingExpense }, { status: 201 });
  } catch (error) {
    console.error('Error creating pending expense:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}

