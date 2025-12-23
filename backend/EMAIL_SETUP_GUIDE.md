# 📧 Email Notification System - Setup Guide

## Overview

The CIIS platform now includes an automated email notification system that sends emails to users for:

1. **Welcome Emails** - Sent when a new user registers on the platform
2. **Issue Resolution Notifications** - Sent when a reported issue is marked as resolved

## Features

✅ **Free Service** - Uses Gmail's free SMTP service (no cost)  
✅ **Modern, Beautiful Design** - Gradient backgrounds, responsive layouts, and professional styling  
✅ **Mobile-Responsive** - Optimized for all devices and email clients  
✅ **Non-blocking** - Email sending doesn't slow down the main application  
✅ **Detailed Information** - Includes all relevant details about registrations and resolutions  
✅ **Visual Elements** - Icons, badges, colored sections for better readability  
✅ **Error Handling** - Graceful degradation if email fails (doesn't break app)

## Setup Instructions

### Step 1: Enable Gmail SMTP

For free email sending, we use Gmail's SMTP service. You need to create a Gmail account or use an existing one.

### Step 2: Get Gmail App Password

Since Gmail requires 2-factor authentication for app access, you need to generate an "App Password":

1. Go to your Google Account: https://myaccount.google.com/
2. Select **Security** from the left menu
3. Under "Signing in to Google," select **2-Step Verification** (enable it if not already)
4. At the bottom, select **App passwords**
5. Select "Mail" as the app and "Other" as the device
6. Name it "CIIS Platform" or similar
7. Click **Generate**
8. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 3: Configure Environment Variables

Add these variables to your `.env` file:

\`\`\`env

# Email Configuration (Gmail SMTP - Free)

EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-character-app-password

# Frontend URL (for links in emails)

FRONTEND_URL=http://localhost:3000
\`\`\`

**Important Notes:**

- `EMAIL_PASSWORD` should be the **16-character App Password** from Google (format: `xxxx xxxx xxxx xxxx`), NOT your actual Gmail password
- Never commit your `.env` file with real credentials to GitHub
- The `.env` file should already be in `.gitignore`

### Step 4: Install Dependencies (Already Done)

The required packages have been installed:

\`\`\`bash
npm install nodemailer @types/nodemailer
\`\`\`

### Step 5: Test the Setup

After adding the environment variables, restart your backend server:

\`\`\`bash
npm run dev
\`\`\`

## Email Types

### 1. Welcome Email

**Triggered:** When a new user registers via `/api/auth/register`

**Contains:**

- Personalized greeting with user's name
- List of platform features
- User account details (email, role, organization)
- "Get Started" CTA button
- Professional branded design

**Preview:**

- Subject: "🎉 Welcome to Campus Infrastructure Intelligence System!"
- Beautiful gradient header with welcome message
- Feature list with icons
- Direct link to login page

### 2. Issue Resolution Email

**Triggered:** When an issue is marked as resolved via `/api/issues/:id/resolve`

**Contains:**

- Congratulatory message
- Complete issue details (title, description, category, severity)
- Resolution comment from the resolver
- Actual cost and duration (if provided)
- Vote count received
- Link to view full issue details
- Reward points information

**Preview:**

- Subject: "✅ Your Issue '[Title]' Has Been Resolved!"
- Green success theme
- Detailed issue information
- Resolution details box
- Link to view issue

## Technical Details

### Email Service Architecture

**File:** `backend/src/services/email.service.ts`

The service includes:

- `sendEmail()` - Generic email sender
- `sendWelcomeEmail()` - Registration confirmation
- `sendIssueResolvedEmail()` - Resolution notification

### Integration Points

1. **Registration:** `backend/src/modules/auth/auth.controller.ts`
   - Calls `sendWelcomeEmail()` after successful user creation
   - Non-blocking (uses `.catch()` to handle errors)

2. **Issue Resolution:** `backend/src/modules/issues/issues.service.ts`
   - Calls `sendIssueResolvedEmail()` after marking issue as resolved
   - Fetches reporter's user data from Firestore
   - Non-blocking email sending

### Error Handling

The email system is designed to fail gracefully:

\`\`\`typescript
// Non-blocking email sending
emailService.sendWelcomeEmail(user).catch((error) => {
console.error("Failed to send welcome email:", error);
});
\`\`\`

If email sending fails:

- Error is logged to console
- User registration/issue resolution continues successfully
- No impact on core functionality

## Alternative Email Services

While we use Gmail's free service, you can easily switch to other providers:

### SendGrid (Free tier: 100 emails/day)

\`\`\`typescript
const transporter = nodemailer.createTransporter({
host: 'smtp.sendgrid.net',
port: 587,
auth: {
user: 'apikey',
pass: process.env.SENDGRID_API_KEY
}
});
\`\`\`

### Mailgun (Free tier: 5,000 emails/month)

\`\`\`typescript
const transporter = nodemailer.createTransporter({
host: 'smtp.mailgun.org',
port: 587,
auth: {
user: process.env.MAILGUN_USER,
pass: process.env.MAILGUN_PASSWORD
}
});
\`\`\`

### Amazon SES (Very affordable)

\`\`\`typescript
const transporter = nodemailer.createTransporter({
host: 'email-smtp.us-east-1.amazonaws.com',
port: 587,
auth: {
user: process.env.AWS_SES_USER,
pass: process.env.AWS_SES_PASSWORD
}
});
\`\`\`

## Troubleshooting

### Common Issues

**1. "Authentication failed" error**

- Make sure you're using an App Password, not your regular Gmail password
- Verify 2-Step Verification is enabled on your Google account
- Check that EMAIL_USER and EMAIL_PASSWORD are correctly set in .env

**2. "Connection timeout" error**

- Check your firewall settings
- Verify you have internet connectivity
- Try using port 465 with `secure: true` instead of port 587

**3. Emails not being received**

- Check spam/junk folder
- Verify the recipient's email address is correct
- Check Gmail's "Sent" folder to confirm emails were sent

**4. Rate limiting**

- Gmail has sending limits (500 emails/day for free accounts)
- Consider using SendGrid or Mailgun for higher volumes

### Debug Mode

To see detailed email sending logs:

\`\`\`typescript
const transporter = nodemailer.createTransporter({
service: "gmail",
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASSWORD,
},
debug: true, // Enable debug output
logger: true // Log information to console
});
\`\`\`

## Testing

### Test Welcome Email

Register a new user:

\`\`\`bash
curl -X POST http://localhost:3001/api/auth/register \
 -H "Content-Type: application/json" \
 -d '{
"email": "test@example.com",
"password": "test123",
"name": "Test User",
"organizationId": "ggv-bilaspur",
"role": "student"
}'
\`\`\`

### Test Resolution Email

Resolve an issue (requires authentication):

\`\`\`bash
curl -X PATCH http://localhost:3001/api/issues/ISSUE_ID/resolve \
 -H "Authorization: Bearer YOUR_TOKEN" \
 -H "Content-Type: application/json" \
 -d '{
"resolutionComment": "Fixed the AC unit",
"actualCost": 2500,
"actualDuration": 2
}'
\`\`\`

## Security Best Practices

1. **Never commit .env file** - Keep credentials secure
2. **Use App Passwords** - Don't use your main Google password
3. **Rotate credentials** - Change passwords periodically
4. **Monitor usage** - Check Gmail sent items regularly
5. **Rate limiting** - Implement email rate limiting if needed

## Production Deployment

For production environments:

1. Use environment variables from your hosting platform (Railway, Heroku, etc.)
2. Consider professional email services for better deliverability
3. Set up proper SPF, DKIM, and DMARC records
4. Use a custom domain email (e.g., noreply@yourdomain.com)
5. Monitor email delivery rates and bounces

## Cost Comparison

| Service        | Free Tier                | Cost After Free Tier      |
| -------------- | ------------------------ | ------------------------- |
| **Gmail**      | 500/day                  | N/A (personal use)        |
| **SendGrid**   | 100/day forever          | $14.95/month (40k emails) |
| **Mailgun**    | 5,000/month for 3 months | $35/month (50k emails)    |
| **Amazon SES** | 62,000/month (if on EC2) | $0.10 per 1,000 emails    |
| **Postmark**   | 100/month                | $10/month (10k emails)    |

## Support

For issues or questions:

- Check the logs in the console
- Review the error messages
- Test with a simple email first
- Verify all environment variables are set correctly

---

**Email System Status:** ✅ Ready to use  
**Last Updated:** December 2024  
**Maintainer:** CIIS Team
