import "../env"; // Load environment variables
import * as emailService from "../services/email.service";
import { User } from "../types";

async function testEmail() {
  console.log("🧪 Testing Email Configuration...\n");

  // Check environment variables
  console.log("📋 Environment Variables:");
  console.log("   EMAIL_USER:", process.env.EMAIL_USER || "❌ NOT SET");
  console.log(
    "   EMAIL_PASSWORD:",
    process.env.EMAIL_PASSWORD
      ? `✅ SET (${process.env.EMAIL_PASSWORD.length} characters)`
      : "❌ NOT SET"
  );
  console.log("   FRONTEND_URL:", process.env.FRONTEND_URL || "❌ NOT SET");
  console.log();

  // Test welcome email
  console.log("📧 Sending test welcome email...");
  const testUser = {
    id: "test-user-123",
    email: "ciis.innovex@gmail.com", // Sending to yourself for testing
    name: "Test User",
    role: "student" as any,
    organizationId: "test-org",
    isActive: true,
    permissions: {
      canCreateIssues: true,
      canResolveIssues: false,
      canAssignIssues: false,
      canViewAllIssues: false,
      canManageUsers: false,
    },
    badges: [],
    rewardPoints: 50,
    level: 1,
    statistics: {
      issuesReported: 0,
      issuesResolved: 0,
      votesReceived: 0,
      votesCast: 0,
      helpfulReports: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
  };

  try {
    await emailService.sendWelcomeEmail(testUser as unknown as User);
    console.log("\n✅ Test completed! Check your inbox at:", testUser.email);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

testEmail();
