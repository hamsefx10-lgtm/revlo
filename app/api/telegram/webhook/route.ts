/**
 * Telegram Webhook Endpoint
 * Receives messages from Telegram Bot API
 */

import { NextRequest, NextResponse } from 'next/server';
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
      const messageId = message.message_id;
      const text = message.text;
      const sender = message.from;

      // Only process text messages
      if (!text) {
        return NextResponse.json({ ok: true });
      }

      // Get company ID from chat ID mapping (you might want to store this in database)
      // For now, we'll use the first company or a default
      // TODO: Implement proper chat-to-company mapping
      const company = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (!company) {
        console.error('No company found for Telegram webhook');
        return NextResponse.json({ ok: true });
      }

      // Parse the message
      const parsed = TelegramParser.parse(text);
      const validation = TelegramParser.validate(parsed);

      // Send review notification
      await telegramSender.sendReviewNotification(chatId, messageId);

      // If validation fails, send clarification request
      if (!validation.valid) {
        await telegramSender.sendClarificationRequest(chatId, messageId, validation.errors);
        
        // Still store it for manual review
        await prisma.pendingExpense.create({
          data: {
            telegramMessageId: messageId.toString(),
            telegramChatId: chatId,
            telegramSenderName: sender?.first_name + (sender?.last_name ? ' ' + sender.last_name : ''),
            telegramSenderId: sender?.id?.toString(),
            originalMessage: text,
            parsedData: parsed,
            status: 'PENDING',
            companyId: company.id,
          },
        });

        return NextResponse.json({ ok: true });
      }

      // Store pending expense
      await prisma.pendingExpense.create({
        data: {
          telegramMessageId: messageId.toString(),
          telegramChatId: chatId,
          telegramSenderName: sender?.first_name + (sender?.last_name ? ' ' + sender.last_name : ''),
          telegramSenderId: sender?.id?.toString(),
          originalMessage: text,
          parsedData: parsed,
          status: 'PENDING',
          companyId: company.id,
        },
      });

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

