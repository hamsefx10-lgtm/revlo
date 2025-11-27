/**
 * Telegram Webhook Endpoint
 * Receives messages from Telegram Bot API
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { TelegramParser } from '@/lib/telegram-parser';
import { telegramSender } from '@/lib/telegram-sender';

// Verify webhook secret (optional but recommended)
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    if (WEBHOOK_SECRET) {
      const secret = request.headers.get('x-telegram-secret');
      if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();

    // Telegram sends updates in this format
    if (body.message) {
      const message = body.message;
      const chatId = message.chat.id.toString();
      const chatTitle = message.chat.title || message.chat.username || message.chat.first_name || 'Telegram Chat';
      const chatType = message.chat.type || 'group';
      const messageId = message.message_id;
      const text = message.text;
      const sender = message.from;

      // Only process text messages
      if (!text) {
        return NextResponse.json({ ok: true });
      }

      // Look up Telegram chat configuration
      let chatConfig = await prisma.telegramChat.findUnique({
        where: { chatId },
      });

      if (!chatConfig) {
        const fallbackCompany = await prisma.company.findFirst({
          orderBy: { createdAt: 'asc' },
        });

        if (!fallbackCompany) {
          console.error('No company found for Telegram webhook');
          return NextResponse.json({ ok: true });
        }

        chatConfig = await prisma.telegramChat.create({
          data: {
            chatId,
            chatName: chatTitle,
            chatType,
            companyId: fallbackCompany.id,
            active: false,
          },
        });

        await telegramSender.sendChatNotLinkedNotice(chatId, messageId, chatTitle);
        return NextResponse.json({ ok: true });
      }

      if (!chatConfig.active) {
        await telegramSender.sendChatInactiveNotice(chatId, messageId);
        return NextResponse.json({ ok: true });
      }

      const companyId = chatConfig.companyId;

      // Ensure sender has been approved
      const telegramUserId = sender?.id?.toString();
      if (telegramUserId) {
        const displayName = `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim() || sender?.username || `User ${telegramUserId}`;
        let userLink = await prisma.telegramUserLink.findUnique({
          where: {
            companyId_telegramUserId: {
              companyId,
              telegramUserId,
            },
          },
        });

        if (!userLink) {
          userLink = await prisma.telegramUserLink.create({
            data: {
              companyId,
              telegramUserId,
              telegramUsername: sender?.username || null,
              telegramDisplayName: displayName,
              status: 'PENDING',
            },
          });
        } else {
          const updates: Record<string, string | null> = {};
          if (displayName && displayName !== userLink.telegramDisplayName) {
            updates.telegramDisplayName = displayName;
          }
          if (sender?.username && sender.username !== userLink.telegramUsername) {
            updates.telegramUsername = sender.username;
          }
          if (Object.keys(updates).length > 0) {
            await prisma.telegramUserLink.update({
              where: { id: userLink.id },
              data: updates,
            });
          }
        }

        if (userLink.status === 'BLOCKED') {
          await telegramSender.sendUserBlockedNotice(chatId, messageId);
          return NextResponse.json({ ok: true });
        }

        if (userLink.status !== 'APPROVED') {
          await telegramSender.sendUserPendingApprovalNotice(chatId, messageId);
          return NextResponse.json({ ok: true });
        }
      }

      // Parse the message
      const parsed = TelegramParser.parse(text);
      const parsedJson = parsed as Prisma.InputJsonValue;
      const validation = TelegramParser.validate(parsed);

      // Send review notification
      await telegramSender.sendReviewNotification(chatId, messageId);

      const pendingExpenseData = {
        telegramMessageId: messageId.toString(),
        telegramChatId: chatId,
        telegramSenderName: sender?.first_name + (sender?.last_name ? ' ' + sender.last_name : ''),
        telegramSenderId: sender?.id?.toString(),
        originalMessage: text,
        parsedData: parsedJson,
        status: 'PENDING',
        companyId,
        projectId: chatConfig.defaultProjectId,
        telegramChatConfigId: chatConfig.id,
      };

      // If validation fails, send clarification request but still store
      if (!validation.valid) {
        await telegramSender.sendClarificationRequest(chatId, messageId, validation.errors);
        await prisma.pendingExpense.create({ data: pendingExpenseData });
        return NextResponse.json({ ok: true });
      }

      // Store pending expense
      await prisma.pendingExpense.create({ data: pendingExpenseData });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true }); // Always return ok to Telegram
  }
}

// GET endpoint for webhook verification (Telegram uses this)
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Telegram webhook endpoint' });
}

