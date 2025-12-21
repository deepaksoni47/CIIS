/**
 * Test script for recurring issues detection
 * Run with: npm run ts-node src/scripts/test-recurring-issues.ts
 */

/* eslint-disable no-console */

import * as admin from "firebase-admin";
import * as analyticsService from "../modules/analytics/analytics.service";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

async function testRecurringIssues() {
  console.log("🔍 Testing Recurring Issues Detection...\n");

  try {
    const organizationId = "ggv-university";
    const timeWindowDays = 60; // Look back 60 days
    const minOccurrences = 2;

    console.log("Parameters:");
    console.log(`- Organization ID: ${organizationId}`);
    console.log(`- Time Window: ${timeWindowDays} days`);
    console.log(`- Min Occurrences: ${minOccurrences}\n`);

    const result = await analyticsService.detectRecurringIssues(
      organizationId,
      timeWindowDays,
      minOccurrences
    );

    console.log("📊 Summary:");
    console.log(
      `- Total Recurring Groups: ${result.summary.totalRecurringGroups}`
    );
    console.log(
      `- Total Recurring Issues: ${result.summary.totalRecurringIssues}`
    );
    console.log(`- High Risk Groups: ${result.summary.highRiskGroups}`);
    console.log(`- Buildings Affected: ${result.summary.buildingsAffected}\n`);

    if (result.recurringIssues.length > 0) {
      console.log("🚨 Recurring Issues (Top 5 by Risk Score):\n");
      result.recurringIssues.slice(0, 5).forEach((group, index) => {
        console.log(`${index + 1}. ${group.category} - ${group.buildingName}`);
        console.log(
          `   Floor: ${group.floor || "N/A"}, Zone: ${group.zone || "N/A"}`
        );
        console.log(`   Occurrences: ${group.occurrences}`);
        console.log(`   Risk Score: ${group.riskScore}`);
        console.log(
          `   Is Recurring Risk: ${group.isRecurringRisk ? "⚠️ YES" : "No"}`
        );
        console.log(
          `   First: ${new Date(group.firstOccurrence).toLocaleDateString()}`
        );
        console.log(
          `   Last: ${new Date(group.lastOccurrence).toLocaleDateString()}`
        );
        console.log(`   Issues:`);
        group.issues.forEach((issue) => {
          console.log(
            `     - ${issue.title} (${issue.status}) - Severity: ${issue.severity}`
          );
        });
        console.log("");
      });
    } else {
      console.log(
        "✅ No recurring issues detected in the specified time window."
      );
    }

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing recurring issues:", error);
    throw error;
  }
}

// Run the test
testRecurringIssues()
  .then(() => {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });
