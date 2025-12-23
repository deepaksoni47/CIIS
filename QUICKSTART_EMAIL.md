# 🚀 Quick Start - Email Notifications

## Setup in 3 Steps (5 minutes)

### Step 1: Get Gmail App Password

1. Visit: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Scroll down to **App passwords**
4. Create new: Select "Mail" → "Other (CIIS)" → Generate
5. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)

### Step 2: Configure Environment

Create or update `backend/.env`:

```env
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
FRONTEND_URL=http://localhost:3000
```

Replace with your actual Gmail and the app password from Step 1.

### Step 3: Restart Server

```bash
cd backend
npm run dev
```

## ✅ You're Done!

Now emails will be sent automatically when:

- ✉️ A user registers → Welcome email
- 📧 An issue is resolved → Resolution notification

## 🧪 Test It

### Test Welcome Email

Register a new user at: http://localhost:3000/login  
Check the email inbox!

### Test Resolution Email

1. Create an issue
2. Resolve it from the issue details page
3. Check the reporter's email inbox!

## 📧 What the Emails Look Like

**Welcome Email:**

- Beautiful purple/blue gradient design
- Lists all CIIS features
- "Get Started" button to login

**Resolution Email:**

- Green success theme
- Full issue details
- Resolution comment
- Link to view issue

## ❓ Troubleshooting

**Emails not arriving?**

- Check spam/junk folder
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- Make sure you're using App Password (not regular Gmail password)
- Check backend console for errors

**Still stuck?**
See full documentation: `backend/EMAIL_SETUP_GUIDE.md`

## 📚 Full Documentation

- Complete Setup: `backend/EMAIL_SETUP_GUIDE.md`
- Implementation Details: `EMAIL_NOTIFICATION_IMPLEMENTATION.md`
- Quick Reference: `docs/EMAIL_NOTIFICATIONS.md`

---

**Cost:** 🆓 Completely Free  
**Time to Setup:** ⏱️ 5 minutes  
**Emails per Day:** 📬 500 (Gmail free tier)
