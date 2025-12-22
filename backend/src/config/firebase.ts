import admin from "firebase-admin";
import process from "process";

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
    console.log("🔍 Debugging Firebase initialization:");
    console.log("   K_SERVICE:", process.env.K_SERVICE || "not set");
    console.log(
      "   FIREBASE_SERVICE_ACCOUNT_KEY:",
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? "Set (length: " +
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY.length +
            ")"
        : "not set"
    );
    console.log(
      "   FIREBASE_PROJECT_ID:",
      process.env.FIREBASE_PROJECT_ID || "not set"
    );
    console.log(
      "   FIREBASE_PRIVATE_KEY:",
      process.env.FIREBASE_PRIVATE_KEY
        ? "Set (length: " + process.env.FIREBASE_PRIVATE_KEY.length + ")"
        : "not set"
    );
    console.log(
      "   FIREBASE_CLIENT_EMAIL:",
      process.env.FIREBASE_CLIENT_EMAIL || "not set"
    );

    // Check if running on Cloud Run (uses ADC)
    if (process.env.K_SERVICE) {
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log(
        "✅ Firebase initialized with Application Default Credentials"
      );
    }
    // Local development with service account JSON string
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      );
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      console.log("✅ Firebase initialized with Service Account JSON");
    }
    // Local development with individual environment variables
    else if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_PRIVATE_KEY &&
      process.env.FIREBASE_CLIENT_EMAIL
    ) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
        storageBucket:
          process.env.FIREBASE_STORAGE_BUCKET ||
          `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      });
      console.log("✅ Firebase initialized with individual credentials");
    }
    // Fallback for emulator
    else {
      firebaseApp = admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || "demo-project",
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
  const db = admin.firestore();
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (e) {
    // Settings might have already been applied
  }
  return db;
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
 * Get Firebase Storage instance
 */
export function getStorage(): admin.storage.Storage {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.storage();
}

/**
 * Firestore collection names
 */
export const COLLECTIONS = {
  ORGANIZATIONS: "organizations",
  DEPARTMENTS: "departments",
  USERS: "users",
  BUILDINGS: "buildings",
  ROOMS: "rooms",
  ISSUES: "issues",
  ISSUE_HISTORY: "issue_history",
  ZONES: "zones",
  RISK_SCORES: "risk_scores",
  PREDICTIONS: "issue_predictions",
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
