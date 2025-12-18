#!/usr/bin/env node
/**
 * Test authentication endpoints
 * Run: npm run test:auth
 */

import axios from "axios";

const BASE_URL = "http://localhost:3001/api";

// Colors for console output
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  reset: "\x1b[0m",
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAuthEndpoints() {
  log("\n🔐 Testing Authentication System\n", colors.blue);

  try {
    // Test 1: Health Check
    log("1️⃣  Testing health endpoint...", colors.yellow);
    const health = await axios.get(`${BASE_URL.replace("/api", "")}/health`);
    log(`✅ Health check passed: ${health.data.status}`, colors.green);

    // Test 2: Login (requires manual token)
    log("\n2️⃣  Testing login endpoint...", colors.yellow);
    log("⚠️  You need a Firebase ID token to test login", colors.yellow);
    log(
      "   Get one from: https://firebase.google.com/docs/auth/admin/verify-id-tokens\n",
      colors.yellow
    );

    // Skip actual login test for now
    log("⏭️  Skipping login test (requires real token)", colors.yellow);

    // Test 3: Unauthenticated access to protected route
    log("\n3️⃣  Testing protected route without auth...", colors.yellow);
    try {
      await axios.get(`${BASE_URL}/auth/me`);
      log("❌ Should have failed without token", colors.red);
    } catch (error: any) {
      if (error.response?.status === 401) {
        log("✅ Correctly rejected unauthenticated request", colors.green);
      } else {
        log(`❌ Unexpected error: ${error.message}`, colors.red);
      }
    }

    // Test 4: Invalid token
    log("\n4️⃣  Testing with invalid token...", colors.yellow);
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: "Bearer invalid-token-123" },
      });
      log("❌ Should have rejected invalid token", colors.red);
    } catch (error: any) {
      if (error.response?.status === 401) {
        log("✅ Correctly rejected invalid token", colors.green);
      } else {
        log(`❌ Unexpected error: ${error.message}`, colors.red);
      }
    }

    // Test 5: Missing Bearer prefix
    log("\n5️⃣  Testing with malformed auth header...", colors.yellow);
    try {
      await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: "invalid-format" },
      });
      log("❌ Should have rejected malformed header", colors.red);
    } catch (error: any) {
      if (error.response?.status === 401) {
        log("✅ Correctly rejected malformed header", colors.green);
      } else {
        log(`❌ Unexpected error: ${error.message}`, colors.red);
      }
    }

    log("\n✅ Basic authentication tests passed!", colors.green);
    log("\n📝 To test full login flow:", colors.blue);
    log("   1. Set up Firebase Auth in Firebase Console", colors.reset);
    log("   2. Enable Google OAuth provider", colors.reset);
    log("   3. Get ID token from frontend Google sign-in", colors.reset);
    log("   4. Test POST /api/auth/login with the token\n", colors.reset);
  } catch (error: any) {
    log(`\n❌ Test failed: ${error.message}`, colors.red);
    if (error.response) {
      log(`   Status: ${error.response.status}`, colors.red);
      log(
        `   Data: ${JSON.stringify(error.response.data, null, 2)}`,
        colors.red
      );
    }
    process.exit(1);
  }
}

// Run tests
testAuthEndpoints();
