# Firebase Setup Guide for CIIS

This guide will help you configure Firebase for the Campus Infrastructure Intelligence System.

## 🔥 Firebase Services Used (100% FREE)

- **Firebase Authentication** - User authentication and authorization
- **Cloud Firestore** - NoSQL database with geospatial queries
- **Firebase Admin SDK** - Backend server integration
- **BigQuery** - Analytics (separate service, FREE sandbox tier)

## 📋 Prerequisites

1. Google Account
2. Node.js 18+ installed
3. Firebase CLI: `npm install -g firebase-tools`

## 🚀 Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `ciis-<your-name>` (e.g., `ciis-deepak`)
4. **Disable Google Analytics** (optional, keeps it free)
5. Click "Create Project"

### 2. Enable Firestore Database

1. In Firebase Console, navigate to **Build > Firestore Database**
2. Click "Create database"
3. Choose **Production mode** (we'll configure rules later)
4. Select location: `us-central1` (or closest to you)
5. Click "Enable"

### 3. Enable Authentication

1. Navigate to **Build > Authentication**
2. Click "Get started"
3. Enable **Email/Password** provider
4. (Optional) Enable **Google** sign-in for easier testing

### 4. Create Service Account Key

**For Local Development:**

1. Go to **Project Settings** (gear icon) > **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json`
4. **⚠️ NEVER commit this file to Git!**

**For Production (Cloud Run):**

- No service account needed! Cloud Run uses Application Default Credentials

### 5. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```env
# Firebase Configuration (FREE)
GOOGLE_CLOUD_PROJECT="ciis-your-project-id"
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"..."}'
```

To set `FIREBASE_SERVICE_ACCOUNT_KEY`:

**Option A - Inline JSON (Recommended for local dev):**

```bash
# Copy entire contents of serviceAccountKey.json as single-line string
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
```

**Option B - File path (Alternative):**

```bash
# Or store path to the file
FIREBASE_SERVICE_ACCOUNT_PATH="./serviceAccountKey.json"
```

### 6. Install Dependencies

```bash
cd backend
npm install
```

### 7. Firestore Security Rules

In Firebase Console, go to **Firestore Database > Rules** and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && request.auth.uid == userId;
    }

    // Buildings collection
    match /buildings/{buildingId} {
      allow read: if true; // Public read for map display
      allow write: if isAdmin();
    }

    // Issues collection
    match /issues/{issueId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAdmin();
    }

    // Issue history
    match /issue_history/{historyId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Zones collection
    match /zones/{zoneId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Risk scores
    match /risk_scores/{scoreId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Analytics (write-only for event logging)
    match /analytics/{eventId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated();
    }
  }
}
```

### 8. Create Firestore Indexes

For geospatial queries, create composite indexes:

1. Go to **Firestore Database > Indexes**
2. Add these composite indexes:

**Issues Collection:**

- Fields: `category` (Ascending), `status` (Ascending), `createdAt` (Descending)
- Fields: `buildingId` (Ascending), `status` (Ascending), `severity` (Descending)

**Buildings Collection:**

- Fields: `buildingType` (Ascending), `createdAt` (Descending)

### 9. Test Firebase Connection

Run the backend server:

```bash
npm run dev
```

You should see:

```
✅ Firebase initialized with Service Account
🚀 CIIS Backend Server Started
```

Test health endpoint:

```bash
curl http://localhost:3001/health
```

### 10. Seed Sample Data (Optional)

Create initial buildings and test data:

```bash
npm run seed
```

## 📊 Firestore Data Structure

### Collections

```
/buildings/{buildingId}
  - id: string
  - name: string
  - location: GeoPoint
  - address: string
  - buildingType: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

/issues/{issueId}
  - id: string
  - category: enum
  - location: GeoPoint
  - severity: number (1-10)
  - status: enum
  - buildingId: string
  - reportedBy: string
  - createdAt: Timestamp

/users/{userId}
  - id: string (Firebase Auth UID)
  - email: string
  - role: enum (admin|staff|student)
  - createdAt: Timestamp
```

## 🔍 Geospatial Queries

Firebase Firestore doesn't have built-in radius queries like PostGIS, but we can use **GeoHash** for proximity searches:

```typescript
import { getFirestore } from "./config/firebase";
import geohash from "ngeohash";

async function findNearbyIssues(lat: number, lon: number, radiusKm: number) {
  const db = getFirestore();

  // Calculate geohash bounds
  const bounds = geohash.bboxes(lat, lon, radiusKm * 1000);

  // Query Firestore
  const issues = [];
  for (const bound of bounds) {
    const snapshot = await db
      .collection("issues")
      .where("geohash", ">=", bound[0])
      .where("geohash", "<=", bound[1])
      .get();

    issues.push(...snapshot.docs.map((doc) => doc.data()));
  }

  return issues;
}
```

## 🌐 Frontend Firebase SDK

In `frontend/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="ciis-xxx.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="ciis-xxx"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

Get these from **Firebase Console > Project Settings > General > Your apps > Web app**

## 💰 Cost Monitoring

Monitor your Firebase usage to stay within FREE tier:

1. Go to **Firebase Console > Usage and billing**
2. Check **Spark Plan** limits:
   - Firestore: 1 GB storage, 50K reads/day, 20K writes/day
   - Auth: Unlimited users (FREE)
   - Hosting: 10 GB storage, 360 MB/day transfer

**Tips to stay FREE:**

- Use Firestore indexes efficiently
- Implement caching in frontend
- Batch write operations
- Use BigQuery Sandbox (1 TB/month FREE) for heavy analytics

## 🐛 Troubleshooting

**"Failed to initialize Firebase"**

- Check `FIREBASE_SERVICE_ACCOUNT_KEY` format (must be valid JSON)
- Verify project ID matches your Firebase project

**"Insufficient permissions"**

- Update Firestore security rules
- Check user's role in `/users/{uid}` document

**"GeoPoint queries slow"**

- Create composite indexes in Firestore Console
- Consider using GeoHash library for proximity queries

## 📚 Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [GeoFire Library](https://github.com/firebase/geofire-js) - Helper for geospatial queries

## ✅ Checklist

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] Authentication enabled (Email/Password)
- [ ] Service account key generated
- [ ] Environment variables configured
- [ ] Security rules updated
- [ ] Composite indexes created
- [ ] Backend server running successfully
- [ ] Test data seeded

---

**Next Steps:** Run `npm run dev` and start building! 🚀
