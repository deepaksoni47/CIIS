# 📧 Email Notifications Feature

## Quick Overview

CIIS now sends automated email notifications to users! 🎉

### What Gets Emailed?

1. **Welcome Email** - When someone registers
2. **Issue Resolved** - When their reported issue gets fixed

### Free & Easy Setup

✅ Uses Gmail's free SMTP (no cost!)  
✅ Beautiful HTML email templates  
✅ Non-blocking (doesn't slow down your app)  
✅ Graceful error handling

## 🚀 Quick Setup (5 Minutes)

### 1. Get Gmail App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to **App passwords** at the bottom
4. Select "Mail" and "Other (Custom name)"
5. Name it "CIIS" and click Generate
6. Copy the 16-character password

### 2. Add to Your .env File

\`\`\`env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx # Your app password from step 1
FRONTEND_URL=http://localhost:3000
\`\`\`

### 3. Restart Server

\`\`\`bash
npm run dev
\`\`\`

**That's it!** Emails will now be sent automatically. 📬

## 📸 Email Previews

### Welcome Email

- Subject: "🎉 Welcome to Campus Infrastructure Intelligence System!"
- Contains: User details, feature list, getting started button
- Theme: Purple/Blue gradient (matches CIIS branding)

### Issue Resolved Email

- Subject: "✅ Your Issue '[Title]' Has Been Resolved!"
- Contains: Issue details, resolution comment, cost/duration, reward points
- Theme: Green success design

## 📚 Full Documentation

See [backend/EMAIL_SETUP_GUIDE.md](../backend/EMAIL_SETUP_GUIDE.md) for:

- Detailed setup instructions
- Troubleshooting guide
- Alternative email providers
- Security best practices
- Production deployment tips

## 🔧 Technical Details

- **Service:** Nodemailer with Gmail SMTP
- **Templates:** Responsive HTML with inline CSS
- **Integration Points:**
  - Registration: `backend/src/modules/auth/auth.controller.ts`
  - Issue Resolution: `backend/src/modules/issues/issues.service.ts`
- **Email Service:** `backend/src/services/email.service.ts`

## 🎨 Customization

### Change Email Templates

Edit `backend/src/services/email.service.ts`:

- Modify HTML in `sendWelcomeEmail()` function
- Modify HTML in `sendIssueResolvedEmail()` function

### Switch Email Provider

Replace Gmail configuration in `createTransporter()` with:

- SendGrid
- Mailgun
- Amazon SES
- Any other SMTP service

## ❓ Troubleshooting

**Emails not sending?**

1. Check console for errors
2. Verify EMAIL_USER and EMAIL_PASSWORD in .env
3. Make sure you're using App Password (not regular password)
4. Check spam/junk folder

**Still having issues?**

- See full troubleshooting guide in EMAIL_SETUP_GUIDE.md
- Check backend logs for detailed error messages

## 📊 Email Limits (Free Tier)

| Provider | Free Limit             |
| -------- | ---------------------- |
| Gmail    | 500/day                |
| SendGrid | 100/day forever        |
| Mailgun  | 5,000/month (3 months) |

Gmail's 500/day is more than enough for most campus uses!

## 🎯 Next Steps

- [ ] Add your Gmail credentials to .env
- [ ] Test by registering a new user
- [ ] Test by resolving an issue
- [ ] Check your inbox for beautiful emails! 📬

---

**Status:** ✅ Ready to use  
**Cost:** 🆓 Completely free (using Gmail)  
**Maintenance:** Minimal - just works!
