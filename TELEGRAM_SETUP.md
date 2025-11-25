# Telegram AI Expense Integration - Setup Guide

## Overview

This system allows people to send expense requests via Telegram, which are automatically parsed by AI and queued for approval in the system.

## Setup Steps

### 1. Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow instructions to create a bot
4. Save the **Bot Token** you receive

### 2. Add Bot to Your Group

1. Add the bot to your Telegram group/channel
2. Make the bot an admin (if using a channel)
3. Get the Chat ID:
   - Add @userinfobot to your group
   - Send `/start` in the group
   - It will show the Chat ID

### 3. Configure Environment Variables

Add to your `.env` file:

```
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here (optional, for security)
```

### 4. Set Up Webhook

After deploying your application, set the webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/api/telegram/webhook"}'
```

Or use this URL format:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook
```

### 5. Run Database Migration

```bash
npx prisma migrate dev --name add_pending_expenses
```

Or if using Prisma Studio:
```bash
npx prisma db push
```

### 6. Test the Integration

1. Send a message in your Telegram group:
   ```
   mohamed site
   5000
   labor
   wuxuu ka shaqeeyay albaabka birta
   ```

2. Check the approval page: `/telegram-expenses`

3. Approve or reject the expense

## Message Format

Users can send expenses in two formats:

### Multi-line format:
```
mohamed site
5000
labor
wuxuu ka shaqeeyay albaabka birta
```

### Single-line format:
```
mohamed site 5000 labor wuxuu ka shaqeeyay albaabka birta
```

## Supported Categories

The AI recognizes these Somali/English terms:

- `labor` / `shaqaale` / `shaqaale mashruuc` → Labor
- `shaqaale shirkad` → Company Labor
- `material` / `alaab` → Material
- `transport` / `gaadiid` → Transport
- `taxi` / `xamaal` → Taxi/Xamaal
- `consultancy` / `talo` → Consultancy
- `equipment` / `qalab` → Equipment Rental
- `utilities` / `adeeg` → Utilities

## How It Works

1. **User sends message** in Telegram group
2. **Webhook receives** the message
3. **AI parses** the message to extract:
   - Project name
   - Amount
   - Category
   - Description
4. **Pending expense** is created in database
5. **User reviews** on `/telegram-expenses` page
6. **User approves/rejects** the expense
7. **If approved**, expense is created in system
8. **Confirmation** is sent back to Telegram

## Troubleshooting

### Bot not receiving messages
- Check if bot is added to group
- Check if bot is admin (for channels)
- Verify webhook URL is set correctly

### Messages not parsing correctly
- Check message format matches examples
- Check category keywords are recognized
- Review parsed data in approval interface

### Expenses not creating
- Check database connection
- Verify account exists
- Check project creation permissions
- Review server logs

## Security Notes

- Webhook secret is optional but recommended
- Validate all user input
- Rate limit webhook endpoint
- Sanitize parsed data before saving

