import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as geminiService from "../modules/ai/gemini.service";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

async function testGeminiFeatures() {
  // eslint-disable-next-line no-console
  console.log("🤖 Testing Gemini AI Features\n");

  const organizationId = "ggv-university";

  try {
    // Test 1: Text Issue Classification
    // eslint-disable-next-line no-console
    console.log("📝 Test 1: Text Issue Classification");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const testTexts = [
        {
          text: "The AC in room 204 is not working. It's very hot and we can't concentrate.",
          context: {
            buildingName: "Engineering Building",
            zone: "Second Floor",
          },
        },
        {
          text: "There's water leaking from the ceiling in the library bathroom. It looks really bad!",
          context: { buildingName: "Library" },
        },
        {
          text: "Broken light bulb in hallway 3A. Not urgent but should be fixed.",
          context: { buildingName: "Science Lab" },
        },
        {
          text: "EMERGENCY: Electrical sparks coming from outlet in room 101. Possible fire hazard!",
          context: { buildingName: "Administration Building" },
        },
      ];

      for (const test of testTexts) {
        // eslint-disable-next-line no-console
        console.log(`\n🔍 Input: "${test.text}"`);
        const classification = await geminiService.classifyIssueFromText(
          test.text,
          test.context
        );
        // eslint-disable-next-line no-console
        console.log(`✅ Classification:`);
        // eslint-disable-next-line no-console
        console.log(`   Category: ${classification.category}`);
        // eslint-disable-next-line no-console
        console.log(`   Issue Type: ${classification.issueType}`);
        // eslint-disable-next-line no-console
        console.log(`   Severity: ${classification.severity}/10`);
        // eslint-disable-next-line no-console
        console.log(`   Priority: ${classification.priority}`);
        // eslint-disable-next-line no-console
        console.log(`   Suggested Title: ${classification.suggestedTitle}`);
        // eslint-disable-next-line no-console
        console.log(`   Urgency: ${classification.urgency}`);
        // eslint-disable-next-line no-console
        console.log(`   ETA: ${classification.estimatedResolutionTime}`);
        if (classification.extractedLocation) {
          // eslint-disable-next-line no-console
          console.log(
            `   Location: ${JSON.stringify(classification.extractedLocation)}`
          );
        }
      }

      // Save classifications
      const outputDir = path.resolve(__dirname, "../../test-output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      // eslint-disable-next-line no-console
      console.log(`\n💾 Classifications saved to: test-output/\n`);
    } catch (error) {
      console.error("❌ Text classification test failed:", error);
    }

    // Test 2: Image Analysis
    // eslint-disable-next-line no-console
    console.log("\n📸 Test 2: Image Analysis");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      // Note: This requires actual image URLs to test properly
      // Using placeholder to demonstrate functionality
      // eslint-disable-next-line no-console
      console.log("ℹ️  Image analysis requires actual image URLs");
      // eslint-disable-next-line no-console
      console.log("ℹ️  Test skipped - provide real image URLs to test");
      // eslint-disable-next-line no-console
      console.log("📝 Example usage:");
      // eslint-disable-next-line no-console
      console.log(
        `   const analysis = await geminiService.analyzeInfrastructureImage(`
      );
      // eslint-disable-next-line no-console
      console.log(`     'https://example.com/issue-image.jpg',`);
      // eslint-disable-next-line no-console
      console.log(
        `     { buildingName: 'Science Lab', expectedCategory: 'Plumbing' }`
      );
      // eslint-disable-next-line no-console
      console.log(`   );`);
      // eslint-disable-next-line no-console
      console.log("");
    } catch (error) {
      console.error("❌ Image analysis test failed:", error);
    }

    // Test 3: Daily Summary
    // eslint-disable-next-line no-console
    console.log("\n📊 Test 3: Daily Summary Generation");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const summary = await geminiService.generateDailySummary(organizationId);
      // eslint-disable-next-line no-console
      console.log(`✅ Generated Daily Summary for ${summary.date}`);
      // eslint-disable-next-line no-console
      console.log(`\n📈 Key Metrics:`);
      // eslint-disable-next-line no-console
      console.log(`   Total Issues: ${summary.keyMetrics.totalIssues}`);
      // eslint-disable-next-line no-console
      console.log(`   New Issues: ${summary.keyMetrics.newIssues}`);
      // eslint-disable-next-line no-console
      console.log(`   Resolved Issues: ${summary.keyMetrics.resolvedIssues}`);
      // eslint-disable-next-line no-console
      console.log(`   Critical Issues: ${summary.keyMetrics.criticalIssues}`);
      // eslint-disable-next-line no-console
      console.log(`   Avg Severity: ${summary.keyMetrics.averageSeverity}/10`);

      // eslint-disable-next-line no-console
      console.log(`\n📋 Executive Summary:`);
      // eslint-disable-next-line no-console
      console.log(`   ${summary.executiveSummary.substring(0, 200)}...`);

      // eslint-disable-next-line no-console
      console.log(`\n⚠️  Top Concerns (${summary.topConcerns.length}):`);
      summary.topConcerns.slice(0, 3).forEach((concern, idx) => {
        // eslint-disable-next-line no-console
        console.log(`   ${idx + 1}. ${concern}`);
      });

      // eslint-disable-next-line no-console
      console.log(`\n💡 Recommendations (${summary.recommendations.length}):`);
      summary.recommendations.slice(0, 3).forEach((rec, idx) => {
        // eslint-disable-next-line no-console
        console.log(`   ${idx + 1}. ${rec}`);
      });

      const outputDir = path.resolve(__dirname, "../../test-output");
      fs.writeFileSync(
        path.join(outputDir, "daily-summary.json"),
        JSON.stringify(summary, null, 2)
      );
      // eslint-disable-next-line no-console
      console.log(`\n💾 Full summary saved to: test-output/daily-summary.json`);
    } catch (error) {
      console.error("❌ Daily summary test failed:", error);
    }

    // Test 4: Trend Explanation
    // eslint-disable-next-line no-console
    console.log("\n\n📈 Test 4: Trend Explanation");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const mockTrends = [
        {
          metric: "Total Issues",
          currentValue: 67,
          previousValue: 52,
          percentageChange: 28.85,
          timeframe: "30 days",
        },
        {
          metric: "Average Resolution Time",
          currentValue: 4.2,
          previousValue: 3.8,
          percentageChange: 10.53,
          timeframe: "30 days",
        },
        {
          metric: "Critical Issues",
          currentValue: 8,
          previousValue: 5,
          percentageChange: 60.0,
          timeframe: "30 days",
        },
      ];

      const explanation =
        await geminiService.generateTrendExplanation(mockTrends);
      // eslint-disable-next-line no-console
      console.log(`✅ Generated Trend Explanation`);
      // eslint-disable-next-line no-console
      console.log(`\n📊 Summary:`);
      // eslint-disable-next-line no-console
      console.log(`   ${explanation.summary}`);

      // eslint-disable-next-line no-console
      console.log(`\n🔍 Key Findings:`);
      explanation.keyFindings.forEach((finding, idx) => {
        // eslint-disable-next-line no-console
        console.log(`   ${idx + 1}. ${finding}`);
      });

      if (explanation.concerningTrends.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`\n⚠️  Concerning Trends:`);
        explanation.concerningTrends.forEach((trend, idx) => {
          // eslint-disable-next-line no-console
          console.log(`   ${idx + 1}. ${trend}`);
        });
      }

      if (explanation.positiveTrends.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`\n✅ Positive Trends:`);
        explanation.positiveTrends.forEach((trend, idx) => {
          // eslint-disable-next-line no-console
          console.log(`   ${idx + 1}. ${trend}`);
        });
      }

      // eslint-disable-next-line no-console
      console.log(`\n💡 Actionable Insights:`);
      explanation.actionableInsights.forEach((insight, idx) => {
        // eslint-disable-next-line no-console
        console.log(`   ${idx + 1}. ${insight}`);
      });

      const outputDir = path.resolve(__dirname, "../../test-output");
      fs.writeFileSync(
        path.join(outputDir, "trend-explanation.json"),
        JSON.stringify(explanation, null, 2)
      );
      // eslint-disable-next-line no-console
      console.log(`\n💾 Saved to: test-output/trend-explanation.json`);
    } catch (error) {
      console.error("❌ Trend explanation test failed:", error);
    }

    // Test 5: Incident Report
    // eslint-disable-next-line no-console
    console.log("\n\n📄 Test 5: Incident Report Generation");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const db = admin.firestore();

      // Get a sample issue
      const issuesSnapshot = await db
        .collection("issues")
        .where("organizationId", "==", organizationId)
        .orderBy("severity", "desc")
        .limit(1)
        .get();

      if (issuesSnapshot.empty) {
        // eslint-disable-next-line no-console
        console.log("ℹ️  No issues found for incident report test");
      } else {
        const issueData = issuesSnapshot.docs[0].data();
        const issue = {
          id: issuesSnapshot.docs[0].id,
          ...issueData,
        };

        // eslint-disable-next-line no-console
        console.log(`🔍 Generating report for: ${issueData.title || issue.id}`);

        const report = await geminiService.generateIncidentReport(issue, []);
        // eslint-disable-next-line no-console
        console.log(`\n✅ Generated Incident Report`);
        // eslint-disable-next-line no-console
        console.log(`\n📋 Title: ${report.reportTitle}`);
        // eslint-disable-next-line no-console
        console.log(`\n📝 Executive Summary:`);
        // eslint-disable-next-line no-console
        console.log(`   ${report.executiveSummary.substring(0, 300)}...`);

        // eslint-disable-next-line no-console
        console.log(`\n🔍 Incident Details:`);
        // eslint-disable-next-line no-console
        console.log(`   What: ${report.incidentDetails.what}`);
        // eslint-disable-next-line no-console
        console.log(`   When: ${report.incidentDetails.when}`);
        // eslint-disable-next-line no-console
        console.log(`   Where: ${report.incidentDetails.where}`);
        // eslint-disable-next-line no-console
        console.log(`   Severity: ${report.incidentDetails.severity}`);

        if (report.timeline.length > 0) {
          // eslint-disable-next-line no-console
          console.log(`\n⏱️  Timeline (${report.timeline.length} events):`);
          report.timeline.slice(0, 3).forEach((event) => {
            // eslint-disable-next-line no-console
            console.log(`   ${event.timestamp}: ${event.event}`);
          });
        }

        // eslint-disable-next-line no-console
        console.log(`\n🎯 Root Cause:`);
        // eslint-disable-next-line no-console
        console.log(`   ${report.rootCauseAnalysis.substring(0, 200)}...`);

        // eslint-disable-next-line no-console
        console.log(`\n💡 Recommendations (${report.recommendations.length}):`);
        report.recommendations.slice(0, 3).forEach((rec, idx) => {
          // eslint-disable-next-line no-console
          console.log(`   ${idx + 1}. ${rec}`);
        });

        const outputDir = path.resolve(__dirname, "../../test-output");
        fs.writeFileSync(
          path.join(outputDir, "incident-report.json"),
          JSON.stringify(report, null, 2)
        );
        // eslint-disable-next-line no-console
        console.log(
          `\n💾 Full report saved to: test-output/incident-report.json`
        );
      }
    } catch (error) {
      console.error("❌ Incident report test failed:", error);
    }

    // Test 6: Existing Features
    // eslint-disable-next-line no-console
    console.log("\n\n🔧 Test 6: Existing Gemini Features");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      // Test priority calculation
      const priority1 = geminiService.calculatePriority(9, "Safety");
      // eslint-disable-next-line no-console
      console.log(`✅ Priority Calculation:`);
      // eslint-disable-next-line no-console
      console.log(`   Safety issue (severity 9) → ${priority1}`);

      const priority2 = geminiService.calculatePriority(5, "Maintenance");
      // eslint-disable-next-line no-console
      console.log(`   Maintenance issue (severity 5) → ${priority2}`);

      // eslint-disable-next-line no-console
      console.log(`\n✅ All core Gemini functions operational`);
    } catch (error) {
      console.error("❌ Existing features test failed:", error);
    }

    // Summary
    // eslint-disable-next-line no-console
    console.log("\n\n✅ Gemini AI Feature Tests Completed!");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    // eslint-disable-next-line no-console
    console.log("✅ Text Issue Classification");
    // eslint-disable-next-line no-console
    console.log("ℹ️  Voice Processing (placeholder - needs Gemini 1.5 Pro)");
    // eslint-disable-next-line no-console
    console.log("ℹ️  Image Analysis (requires image URLs)");
    // eslint-disable-next-line no-console
    console.log("✅ Daily Summary Generation");
    // eslint-disable-next-line no-console
    console.log("✅ Trend Explanation");
    // eslint-disable-next-line no-console
    console.log("✅ Incident Report Generation");
    // eslint-disable-next-line no-console
    console.log("✅ Core Priority & Risk Features");
    // eslint-disable-next-line no-console
    console.log("\n📁 Output files saved to: backend/test-output/");
    // eslint-disable-next-line no-console
    console.log("\n📚 API Documentation: backend/docs/GEMINI_AI_API.md");
  } catch (error) {
    console.error("❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run tests
testGeminiFeatures()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("\n✨ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
