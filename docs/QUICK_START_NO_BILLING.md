# 🚀 Quick Start Guide - NO BILLING REQUIRED

This guide will help you set up CIIS in **15 minutes** without ANY billing accounts or credit cards!

## 📋 What You Need

- ✅ Gmail/Google Account (free)
- ✅ Node.js 18+ installed
- ✅ Git installed
- ❌ **NO credit card needed**
- ❌ **NO billing account needed**

---

## Step 1: Clone Repository (2 min)

```powershell
git clone https://github.com/deepaksoni47/CIIS.git
cd CIIS
```

---

## Step 2: Firebase Setup (5 min)

### 2.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add Project"**
3. Enter name: `ciis-your-name` (e.g., `ciis-deepak`)
4. **IMPORTANT:** Disable Google Analytics (keeps it free)
5. Click **"Create Project"**

### 2.2 Enable Firestore

1. In Firebase Console, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**
3. Choose **"Production mode"**
4. Select region: **us-central1** (or closest to you)
5. Click **"Enable"**
6. ✅ **NO BILLING ACCOUNT REQUIRED!**

### 2.3 Enable Authentication

1. Click **"Build"** → **"Authentication"**
2. Click **"Get started"**
3. Enable **"Email/Password"** provider
4. (Optional) Enable **"Google"** sign-in
5. ✅ **NO BILLING ACCOUNT REQUIRED!**

### 2.4 Get Service Account Key

1. Click ⚙️ **"Project Settings"** (top left)
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** (downloads JSON file)
5. Save as `serviceAccountKey.json` in project root
6. ⚠️ **NEVER commit this file to Git!**

---

## Step 3: Gemini API Setup (2 min)

### 3.1 Get API Key (No Billing!)

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"**
3. Select your Firebase project
4. Click **"Create API key in existing project"**
5. Copy the API key
6. ✅ **NO BILLING ACCOUNT REQUIRED!**
7. ✅ **FREE 15 requests/minute forever**

---

## Step 4: Configure Environment (3 min)

### 4.1 Backend Configuration

```powershell
cd backend
cp .env.example .env
```

Edit `backend/.env` and add:

```env
# Firebase Configuration (from serviceAccountKey.json)
FIREBASE_PROJECT_ID="ciis-your-name"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_FULL_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@ciis-your-name.iam.gserviceaccount.com"
FIREBASE_DATABASE_URL="https://ciis-your-name.firebaseio.com"

# Gemini API Key (from Step 3)
GOOGLE_GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# Application
NODE_ENV="development"
PORT="3001"
```

### 4.2 Frontend Configuration

```powershell
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` and add:

```env
# Backend API
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"

# Firebase Web SDK (from Firebase Console > Project Settings > General)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXX"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ciis-your-name.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ciis-your-name"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef123456"
```

**To find Firebase Web Config:**

1. Firebase Console → Project Settings → General
2. Scroll to "Your apps"
3. Click web app icon (</>) or "Add app"
4. Copy configuration values

---

## Step 5: Install & Run (3 min)

### 5.1 Backend

```powershell
cd backend
npm install
npm run dev
```

You should see:

```
✅ Firebase initialized with Service Account
🚀 CIIS Backend Server Started
📍 Server: http://localhost:3001
🏥 Health: http://localhost:3001/health
```

### 5.2 Frontend (New Terminal)

```powershell
cd frontend
npm install
npm run dev
```

You should see:

```
✓ Ready in 2.5s
  Local: http://localhost:3000
```

---

## Step 6: Verify Setup (1 min)

### Test Backend

```powershell
curl http://localhost:3001/health
```

Should return:

```json
{
  "status": "healthy",
  "timestamp": "2025-12-16T...",
  "environment": "development"
}
```

### Test Frontend

Open browser: http://localhost:3000

---

## 🎉 You're Done!

Your CIIS platform is now running with:

✅ Firebase Firestore (NoSQL database) - FREE
✅ Firebase Auth (user authentication) - FREE  
✅ Gemini AI (text insights) - FREE
✅ Leaflet Maps (OpenStreetMap) - FREE
✅ **NO billing accounts or credit cards!**

---

## 📊 Usage Limits (All FREE)

### Firebase Spark Plan (No Billing)

- **Firestore:** 1 GB storage, 50K reads/day, 20K writes/day
- **Auth:** Unlimited users
- **Hosting:** 10GB storage, 360MB/day bandwidth

### Gemini AI Studio (No Billing)

- **Requests:** 15 per minute, 1,500 per day
- **Tokens:** Generous limits for text generation

### OpenStreetMap (No Billing)

- **Map Tiles:** Unlimited (fair use)
- **No API key needed**

---

## 🐛 Troubleshooting

### "Failed to initialize Firebase"

- Check `FIREBASE_PRIVATE_KEY` is properly escaped (keep `\n`)
- Verify `FIREBASE_PROJECT_ID` matches your project
- Ensure `serviceAccountKey.json` is valid

### "Gemini API error"

- Verify API key starts with `AIzaSy`
- Check you selected correct Firebase project
- Wait a few minutes for key to activate

### "Map not loading"

- Check browser console for errors
- Verify `leaflet` package is installed: `npm list leaflet`
- Clear Next.js cache: `rm -rf .next && npm run dev`

### "Port already in use"

- Backend: Change `PORT=3001` to `PORT=3002` in `.env`
- Frontend: Run `npm run dev -- -p 3001` to use different port

---

## 🚀 Next Steps

1. **Add Sample Data**

   ```powershell
   cd backend
   npm run seed  # (You'll need to create this script)
   ```

2. **Deploy to Firebase Hosting**

   ```powershell
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   npm run build
   firebase deploy
   ```

3. **Customize for Your Campus**
   - Update map center in `CampusMap.tsx`
   - Add your buildings to Firestore
   - Customize issue categories

---

## 📚 Documentation

- **Firebase Setup:** See `docs/FIREBASE_SETUP.md`
- **Architecture:** See `docs/NO_BILLING_MIGRATION.md`
- **API Docs:** See `docs/api/`

---

## 💬 Need Help?

- **Issues:** https://github.com/deepaksoni47/CIIS/issues
- **Discussions:** https://github.com/deepaksoni47/CIIS/discussions
- **Email:** (Add your contact)

---

**Happy Building! 🎊**

Remember: This entire stack costs **$0** and requires **NO billing account**. Perfect for students and hackathons!
