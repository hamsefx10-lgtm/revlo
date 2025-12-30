# Email Setup Instructions

## Fariimaha Xiriirka - Email Configuration

Marka qof fariin soo diro contact form-ka, waa la dirayaa email-ka: **hamsemoalin@gmail.com**

## Option 1: Resend (Recommended - Easy & Free)

Resend waa adeeg email fudud oo bilaash ah (100 emails/day).

### Steps:

1. **Create Resend Account:**
   - Go to https://resend.com
   - Sign up for free account
   - Verify your email

2. **Get API Key:**
   - Go to API Keys section
   - Create new API key
   - Copy the API key

3. **Add to .env file:**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   CONTACT_EMAIL=hamsemoalin@gmail.com
   ```

4. **Verify Domain (Optional but Recommended):**
   - Add your domain in Resend dashboard
   - Add DNS records they provide
   - This allows you to send from your own domain

## Option 2: Gmail SMTP (Alternative)

Haddii aad Gmail u isticmaasho:

1. **Enable App Password in Gmail:**
   - Go to Google Account settings
   - Security → 2-Step Verification (enable if not enabled)
   - App passwords → Generate new app password
   - Copy the 16-character password

2. **Add to .env file:**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   CONTACT_EMAIL=hamsemoalin@gmail.com
   ```

**Note:** Gmail SMTP requires installing `nodemailer` package. Run:
```bash
npm install nodemailer
```

Then update `lib/email.ts` to use nodemailer instead of Resend.

## Testing

After setup, test by submitting a contact form. You should receive an email at **hamsemoalin@gmail.com** with:
- Name of sender
- Email of sender
- Subject
- Full message

## Troubleshooting

- **Email not received?** Check server logs for errors
- **Resend errors?** Verify API key is correct and domain is verified
- **Gmail errors?** Make sure 2FA is enabled and app password is correct

## Current Configuration

- **Recipient Email:** hamsemoalin@gmail.com (set via `CONTACT_EMAIL` env variable)
- **Email Service:** Resend (if `RESEND_API_KEY` is set)

