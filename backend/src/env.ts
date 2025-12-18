/**
 * Environment variable loader
 * This MUST be imported first, before any other modules
 */
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from parent directory
const envPath = path.join(process.cwd(), "../.env");
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error("❌ Failed to load .env file:", result.error);
  console.log("   Tried path:", envPath);
} else {
  console.log("✅ Environment variables loaded");
  console.log(
    "   FIREBASE_PROJECT_ID:",
    process.env.FIREBASE_PROJECT_ID || "Not set"
  );
  console.log(
    "   FIREBASE_PRIVATE_KEY:",
    process.env.FIREBASE_PRIVATE_KEY
      ? `Set (${process.env.FIREBASE_PRIVATE_KEY.length} chars)`
      : "Not set"
  );
  console.log(
    "   FIREBASE_CLIENT_EMAIL:",
    process.env.FIREBASE_CLIENT_EMAIL || "Not set"
  );
}

// Verify critical variables are set
if (
  !process.env.FIREBASE_PROJECT_ID ||
  !process.env.FIREBASE_PRIVATE_KEY ||
  !process.env.FIREBASE_CLIENT_EMAIL
) {
  console.error("❌ Critical Firebase environment variables are missing!");
  console.error("   Make sure .env file exists at:", envPath);
  process.exit(1);
}
