import admin from "firebase-admin";

/**
 * Initialize Firebase Admin SDK
 *
 * For local development:
 * 1. Download service account key from Firebase Console
 * 2. Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable
 *
 * For Cloud Run (Production):
 * - Uses Application Default Credentials automatically
 */

let firebaseApp: admin.app.App;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if running on Cloud Run (uses ADC)
    if (process.env.K_SERVICE) {
      firebaseApp = admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
      console.log(
        "✅ Firebase initialized with Application Default Credentials"
      );
    }
    // Local development with service account
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.GOOGLE_CLOUD_PROJECT,
      });
      console.log("✅ Firebase initialized with Service Account");
    }
    // Fallback for emulator
    else {
      firebaseApp = admin.initializeApp({
        projectId: process.env.GOOGLE_CLOUD_PROJECT || "demo-project",
      });
      console.log(
        "⚠️  Firebase initialized without credentials (emulator mode)"
      );
    }

    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase:", error);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
}

/**
 * Get Firebase Auth instance
 */
export function getAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
}

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  USERS: "users",
  BUILDINGS: "buildings",
  ISSUES: "issues",
  ISSUE_HISTORY: "issue_history",
  ZONES: "zones",
  RISK_SCORES: "risk_scores",
  ANALYTICS: "analytics",
} as const;

/**
 * Helper function to create GeoPoint from coordinates
 */
export function createGeoPoint(
  latitude: number,
  longitude: number
): admin.firestore.GeoPoint {
  return new admin.firestore.GeoPoint(latitude, longitude);
}

export default {
  initializeFirebase,
  getFirestore,
  getAuth,
  COLLECTIONS,
  createGeoPoint,
};
