# Authentication with Google OAuth - Backend Guide

## 🔐 Overview

The authentication system uses **Firebase Authentication** with **Google OAuth** provider. No separate JWT implementation needed - Firebase handles everything!

---

## 📦 Backend Structure

```
backend/src/modules/auth/
├── auth.service.ts       # Business logic (user management)
├── auth.controller.ts    # Request handlers
├── auth.middleware.ts    # Authentication & authorization middleware
└── routes.ts            # API endpoints
```

---

## 🔑 API Endpoints

### 1. **Login with Google OAuth**

```http
POST /api/auth/login
Content-Type: application/json

{
  "idToken": "eyJhbGciOiJSUzI1NiIs...",
  "organizationId": "ggv-bilaspur",
  "role": "student"  // optional, defaults to "student"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "firebase-uid",
      "email": "deepak@ggu.ac.in",
      "name": "Deepak Soni",
      "role": "student",
      "organizationId": "ggv-bilaspur",
      "permissions": {
        "canCreateIssues": true,
        "canResolveIssues": false,
        ...
      }
    },
    "token": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

### 2. **Get Current User**

```http
GET /api/auth/me
Authorization: Bearer {idToken}

Response:
{
  "success": true,
  "data": {
    "id": "user-id",
    "email": "user@ggu.ac.in",
    "name": "User Name",
    "role": "student",
    "organizationId": "ggv-bilaspur",
    "permissions": {...}
  }
}
```

### 3. **Update Profile**

```http
PATCH /api/auth/profile
Authorization: Bearer {idToken}

{
  "name": "New Name",
  "phone": "+91-9876543210",
  "preferences": {
    "notifications": true
  }
}
```

### 4. **Get Organization Users** (Admin/Facility Manager only)

```http
GET /api/auth/users/ggv-bilaspur?role=student
Authorization: Bearer {idToken}
```

### 5. **Update User Role** (Admin only)

```http
PATCH /api/auth/users/{userId}/role
Authorization: Bearer {idToken}

{
  "role": "facility_manager"
}
```

### 6. **Deactivate User** (Admin only)

```http
DELETE /api/auth/users/{userId}
Authorization: Bearer {idToken}
```

---

## 🔒 Middleware Usage

### Protect Routes

```typescript
import {
  authenticate,
  authorize,
  requirePermission,
} from "./modules/auth/auth.middleware";

// Require authentication
app.get("/api/issues", authenticate, getIssues);

// Require specific role
app.post(
  "/api/issues/assign",
  authenticate,
  authorize("admin", "facility_manager"),
  assignIssue
);

// Require specific permission
app.patch(
  "/api/issues/:id/resolve",
  authenticate,
  requirePermission("canResolveIssues"),
  resolveIssue
);

// Optional authentication
app.get("/api/buildings", optionalAuth, getBuildings);
```

---

## 🎭 Role-Based Permissions

| Role                 | Permissions                                     |
| -------------------- | ----------------------------------------------- |
| **Student**          | Create issues only, view own issues             |
| **Faculty**          | Create issues, view department issues           |
| **Staff**            | Create & resolve issues, view department issues |
| **Facility Manager** | All issue management, view all issues           |
| **Admin**            | Full system access, manage users                |

---

## 🔐 Frontend Implementation

### 1. Firebase Setup (Frontend)

```bash
npm install firebase
```

```typescript
// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### 2. Google Sign-In Component

```typescript
// components/GoogleSignIn.tsx
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export function GoogleSignIn() {
  const handleGoogleSignIn = async () => {
    try {
      // 1. Sign in with Google popup
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // 2. Get Firebase ID token
      const idToken = await user.getIdToken();

      // 3. Send token to backend
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          organizationId: "ggv-bilaspur", // From user selection or config
          role: "student", // Optional
        }),
      });

      const data = await response.json();

      if (data.success) {
        // 4. Store user data and token
        localStorage.setItem("user", JSON.stringify(data.data.user));
        localStorage.setItem("token", data.data.token);

        // 5. Redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Sign-in error:", error);
    }
  };

  return (
    <button onClick={handleGoogleSignIn} className="google-signin-btn">
      <img src="/google-icon.svg" alt="Google" />
      Sign in with Google
    </button>
  );
}
```

### 3. Protected Route Component

```typescript
// components/ProtectedRoute.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      // Verify with backend
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:3001/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAuthorized(true);
      } else {
        router.push("/login");
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <div>Loading...</div>;
  if (!authorized) return null;

  return <>{children}</>;
}
```

### 4. API Helper with Auth

```typescript
// lib/api.ts
import { auth } from "./firebase";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User not authenticated");
  }

  const token = await user.getIdToken();

  const response = await fetch(`http://localhost:3001${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Request failed");
  }

  return response.json();
}

// Usage
async function createIssue(data: any) {
  return apiRequest("/api/issues", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

---

## 🔧 Environment Variables

### Backend (.env)

```bash
# Already configured
FIREBASE_PROJECT_ID=ciis-2882b
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@ciis-2882b.iam.gserviceaccount.com
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ciis-2882b.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ciis-2882b
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ciis-2882b.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Get these from Firebase Console:**

1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps" section
3. Click "Web app" or add new web app
4. Copy the config values

---

## 🎯 User Flow

### First-Time Login

```
1. User clicks "Sign in with Google"
2. Google OAuth popup opens
3. User selects Google account
4. Firebase returns ID token
5. Frontend sends token to backend /api/auth/login
6. Backend verifies token
7. Backend creates user in Firestore (if new)
8. Backend returns user data + permissions
9. Frontend stores token & user data
10. User redirected to dashboard
```

### Subsequent Visits

```
1. Frontend checks localStorage for token
2. Firebase auth persists session
3. Auto-login with stored credentials
4. Token auto-refreshes (Firebase handles this)
```

---

## 🔐 Security Features

### ✅ Implemented

- Firebase ID token verification
- Role-based access control (RBAC)
- Permission-based authorization
- Organization-scoped access
- Token expiration handling
- Inactive user blocking

### 🔒 Security Rules

```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUser() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function hasRole(role) {
      return isAuthenticated() && getUser().role == role;
    }

    function sameOrg(orgId) {
      return isAuthenticated() && getUser().organizationId == orgId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() &&
                     (request.auth.uid == userId || hasRole('admin'));
      allow write: if hasRole('admin');
    }

    // Issues - students see own, managers see all in org
    match /issues/{issueId} {
      allow read: if isAuthenticated() &&
                     (sameOrg(resource.data.organizationId) || hasRole('admin'));
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() &&
                       (getUser().permissions.canResolveIssues || hasRole('admin'));
    }
  }
}
```

---

## 🧪 Testing

### Test Login (Postman/cURL)

```bash
# 1. Get ID token from Firebase (use frontend or Firebase Emulator)
# 2. Test login endpoint

curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "YOUR_FIREBASE_ID_TOKEN",
    "organizationId": "ggv-bilaspur",
    "role": "student"
  }'

# 3. Test protected endpoint
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

---

## 📊 Role Assignment Logic

### Automatic Role Detection (Future Enhancement)

```typescript
// Detect role from email domain
function detectRoleFromEmail(email: string): UserRole {
  if (email.endsWith("@admin.ggu.ac.in")) return "admin";
  if (email.endsWith("@faculty.ggu.ac.in")) return "faculty";
  if (email.endsWith("@staff.ggu.ac.in")) return "staff";
  return "student"; // Default
}
```

---

## 🚀 Next Steps

1. **Enable Google OAuth in Firebase Console**

   - Go to Authentication → Sign-in method
   - Enable Google provider
   - Add authorized domain (localhost, your-domain.com)

2. **Get Frontend Firebase Config**

   - Copy from Firebase Console → Project Settings

3. **Test Login Flow**

   - Backend running on :3001
   - Frontend with Google Sign-In button
   - Test with your Google account

4. **Implement Protected Routes**
   - Use middleware for all issue endpoints
   - Restrict admin features

Ready to test the auth system?
