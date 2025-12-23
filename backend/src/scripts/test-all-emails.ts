import "../env"; // Load environment variables
import * as emailService from "../services/email.service";
import { User } from "../types";

async function testEmailNotifications() {
  console.log("🧪 Testing Email Notifications...\n");

  // Test user data
  const testUser = {
    id: "test-user-456",
    email: "ciis.innovex@gmail.com",
    name: "Test User",
    role: "student" as any,
    organizationId: "ggv-bilaspur",
    isActive: true,
    permissions: {
      canCreateIssues: true,
      canResolveIssues: false,
      canAssignIssues: false,
      canViewAllIssues: false,
      canManageUsers: false,
    },
    badges: [],
    rewardPoints: 100,
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

  const testIssue = {
    id: "test-issue-789",
    title: "Test Broken Water Fountain",
    description: "Water fountain on 2nd floor is not working properly",
    category: "water_supply" as any,
    severity: 7,
    status: "open" as any,
    priority: 85,
    reportedBy: testUser.id,
    organizationId: "ggv-bilaspur",
    buildingId: "building_001",
    location: {
      building: "Main Building",
      floor: "2nd Floor",
      room: "Common Area",
    },
    submissionType: "manual" as any,
    reportedByRole: "student" as any,
    voteCount: 5,
    votedBy: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    console.log("📧 1. Testing Welcome Email (OAuth Registration)...");
    await emailService.sendWelcomeEmail(testUser as unknown as User);
    console.log("✅ Welcome email sent!\n");

    console.log("📧 2. Testing Issue Resolved Email...");
    await emailService.sendIssueResolvedEmail(
      testUser as unknown as User,
      testIssue as any,
      "The water fountain has been repaired and is now working properly."
    );
    console.log("✅ Issue resolved email sent!\n");

    console.log("📧 3. Testing Issue Deleted Email...");
    await emailService.sendIssueDeletedEmail(
      testUser as unknown as User,
      testIssue as any
    );
    console.log("✅ Issue deleted email sent!\n");

    console.log("🎉 All tests completed! Check your inbox at:", testUser.email);
  } catch (error) {
    console.error("\n❌ Test failed:", error);
  }
}

testEmailNotifications();
