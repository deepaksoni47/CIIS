import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import {
  exportAnalyticsToCSV,
  generateSnapshotReport,
} from "../modules/analytics/analytics.service";

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

async function testExportReports() {
  // eslint-disable-next-line no-console
  console.log("🚀 Testing Export and Reports Functionality\n");

  const organizationId = "ggv-university";
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const endDate = new Date();

  try {
    // Test 1: Export Issues CSV
    // eslint-disable-next-line no-console
    console.log("📊 Test 1: Export Issues CSV");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const issuesCSV = await exportAnalyticsToCSV(
        organizationId,
        "issues",
        startDate,
        endDate
      );
      const lines = issuesCSV.split("\n").filter((line) => line.trim());
      // eslint-disable-next-line no-console
      console.log(
        `✅ Generated Issues CSV: ${lines.length} lines (including header)`
      );
      // eslint-disable-next-line no-console
      console.log(`📝 Headers: ${lines[0]}`);
      if (lines.length > 1) {
        // eslint-disable-next-line no-console
        console.log(`📝 Sample row: ${lines[1].substring(0, 100)}...`);
      }

      // Save to file
      const outputDir = path.resolve(__dirname, "../../test-output");
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      fs.writeFileSync(path.join(outputDir, "issues-export.csv"), issuesCSV);
      // eslint-disable-next-line no-console
      console.log(`💾 Saved to: test-output/issues-export.csv\n`);
    } catch (error) {
      console.error("❌ Issues export failed:", error);
    }

    // Test 2: Export MTTR CSV
    // eslint-disable-next-line no-console
    console.log("📊 Test 2: Export MTTR CSV");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const mttrCSV = await exportAnalyticsToCSV(
        organizationId,
        "mttr",
        startDate,
        endDate
      );
      const lines = mttrCSV.split("\n").filter((line) => line.trim());
      // eslint-disable-next-line no-console
      console.log(
        `✅ Generated MTTR CSV: ${lines.length} lines (including header)`
      );
      // eslint-disable-next-line no-console
      console.log(`📝 Headers: ${lines[0]}`);
      if (lines.length > 1) {
        // eslint-disable-next-line no-console
        console.log(`📝 Sample row: ${lines[1]}`);
      }

      const outputDir = path.resolve(__dirname, "../../test-output");
      fs.writeFileSync(path.join(outputDir, "mttr-export.csv"), mttrCSV);
      // eslint-disable-next-line no-console
      console.log(`💾 Saved to: test-output/mttr-export.csv\n`);
    } catch (error) {
      console.error("❌ MTTR export failed:", error);
    }

    // Test 3: Export Buildings CSV
    // eslint-disable-next-line no-console
    console.log("📊 Test 3: Export High-Risk Buildings CSV");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const buildingsCSV = await exportAnalyticsToCSV(
        organizationId,
        "buildings",
        startDate,
        endDate
      );
      const lines = buildingsCSV.split("\n").filter((line) => line.trim());
      // eslint-disable-next-line no-console
      console.log(
        `✅ Generated Buildings CSV: ${lines.length} lines (including header)`
      );
      // eslint-disable-next-line no-console
      console.log(`📝 Headers: ${lines[0]}`);
      if (lines.length > 1) {
        // eslint-disable-next-line no-console
        console.log(`📝 Sample row: ${lines[1]}`);
      }

      const outputDir = path.resolve(__dirname, "../../test-output");
      fs.writeFileSync(
        path.join(outputDir, "buildings-export.csv"),
        buildingsCSV
      );
      // eslint-disable-next-line no-console
      console.log(`💾 Saved to: test-output/buildings-export.csv\n`);
    } catch (error) {
      console.error("❌ Buildings export failed:", error);
    }

    // Test 4: Export Summary CSV
    // eslint-disable-next-line no-console
    console.log("📊 Test 4: Export Executive Summary CSV");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const summaryCSV = await exportAnalyticsToCSV(
        organizationId,
        "summary",
        startDate,
        endDate
      );
      const lines = summaryCSV.split("\n").filter((line) => line.trim());
      // eslint-disable-next-line no-console
      console.log(
        `✅ Generated Summary CSV: ${lines.length} lines (including header)`
      );
      // eslint-disable-next-line no-console
      console.log(`📝 Headers: ${lines[0]}`);
      // eslint-disable-next-line no-console
      console.log("📝 Sample metrics:");
      lines.slice(1, Math.min(6, lines.length)).forEach((line) => {
        // eslint-disable-next-line no-console
        console.log(`   ${line}`);
      });

      const outputDir = path.resolve(__dirname, "../../test-output");
      fs.writeFileSync(path.join(outputDir, "summary-export.csv"), summaryCSV);
      // eslint-disable-next-line no-console
      console.log(`💾 Saved to: test-output/summary-export.csv\n`);
    } catch (error) {
      console.error("❌ Summary export failed:", error);
    }

    // Test 5: Daily Snapshot Report
    // eslint-disable-next-line no-console
    console.log("📊 Test 5: Daily Snapshot Report");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const dailySnapshot = await generateSnapshotReport(
        organizationId,
        "daily"
      );
      // eslint-disable-next-line no-console
      console.log(`✅ Generated Daily Snapshot`);
      // eslint-disable-next-line no-console
      console.log(`📅 Period: ${dailySnapshot.period}`);
      // eslint-disable-next-line no-console
      console.log(`📈 Summary:`);
      // eslint-disable-next-line no-console
      console.log(`   Total Issues: ${dailySnapshot.summary.totalIssues}`);
      // eslint-disable-next-line no-console
      console.log(`   Open Issues: ${dailySnapshot.summary.openIssues}`);
      // eslint-disable-next-line no-console
      console.log(
        `   Resolved Issues: ${dailySnapshot.summary.resolvedIssues}`
      );
      // eslint-disable-next-line no-console
      console.log(
        `   Critical Issues: ${dailySnapshot.summary.criticalIssues}`
      );
      // eslint-disable-next-line no-console
      console.log(
        `   Avg Severity: ${dailySnapshot.summary.avgSeverity.toFixed(2)}`
      );
      // eslint-disable-next-line no-console
      console.log(`   MTTR: ${dailySnapshot.summary.mttr.toFixed(2)} hours`);
      // eslint-disable-next-line no-console
      console.log(`📊 Trends:`);
      // eslint-disable-next-line no-console
      console.log(
        `   Issue Growth: ${dailySnapshot.trends.issueGrowth > 0 ? "+" : ""}${dailySnapshot.trends.issueGrowth.toFixed(1)}%`
      );
      // eslint-disable-next-line no-console
      console.log(
        `   MTTR Change: ${dailySnapshot.trends.mttrChange > 0 ? "+" : ""}${dailySnapshot.trends.mttrChange.toFixed(1)}%`
      );

      if (dailySnapshot.alerts.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`🚨 Alerts (${dailySnapshot.alerts.length}):`);
        dailySnapshot.alerts.forEach((alert) => {
          // eslint-disable-next-line no-console
          console.log(`   [${alert.type.toUpperCase()}] ${alert.message}`);
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(`✅ No alerts - all metrics within normal range`);
      }

      // eslint-disable-next-line no-console
      console.log(`🏢 Top Buildings:`);
      dailySnapshot.topBuildings.slice(0, 3).forEach(
        (
          building: {
            buildingName: string;
            issueCount: number;
            criticalCount: number;
          },
          idx: number
        ) => {
          // eslint-disable-next-line no-console
          console.log(
            `   ${idx + 1}. ${building.buildingName}: ${building.issueCount} issues (${building.criticalCount} critical)`
          );
        }
      );

      const outputDir = path.resolve(__dirname, "../../test-output");
      fs.writeFileSync(
        path.join(outputDir, "daily-snapshot.json"),
        JSON.stringify(dailySnapshot, null, 2)
      );
      // eslint-disable-next-line no-console
      console.log(`💾 Saved to: test-output/daily-snapshot.json\n`);
    } catch (error) {
      console.error("❌ Daily snapshot failed:", error);
    }

    // Test 6: Weekly Snapshot Report
    // eslint-disable-next-line no-console
    console.log("📊 Test 6: Weekly Snapshot Report");
    // eslint-disable-next-line no-console
    console.log("=====================================");
    try {
      const weeklySnapshot = await generateSnapshotReport(
        organizationId,
        "weekly"
      );
      // eslint-disable-next-line no-console
      console.log(`✅ Generated Weekly Snapshot`);
      // eslint-disable-next-line no-console
      console.log(`📅 Period: ${weeklySnapshot.period}`);
      // eslint-disable-next-line no-console
      console.log(`📈 Summary:`);
      // eslint-disable-next-line no-console
      console.log(`   Total Issues: ${weeklySnapshot.summary.totalIssues}`);
      // eslint-disable-next-line no-console
      console.log(`   Open Issues: ${weeklySnapshot.summary.openIssues}`);
      // eslint-disable-next-line no-console
      console.log(
        `   Resolved Issues: ${weeklySnapshot.summary.resolvedIssues}`
      );
      // eslint-disable-next-line no-console
      console.log(
        `   Critical Issues: ${weeklySnapshot.summary.criticalIssues}`
      );
      // eslint-disable-next-line no-console
      console.log(
        `   Avg Severity: ${weeklySnapshot.summary.avgSeverity.toFixed(2)}`
      );
      // eslint-disable-next-line no-console
      console.log(`   MTTR: ${weeklySnapshot.summary.mttr.toFixed(2)} hours`);
      // eslint-disable-next-line no-console
      console.log(`📊 Trends:`);
      // eslint-disable-next-line no-console
      console.log(
        `   Issue Growth: ${weeklySnapshot.trends.issueGrowth > 0 ? "+" : ""}${weeklySnapshot.trends.issueGrowth.toFixed(1)}%`
      );
      // eslint-disable-next-line no-console
      console.log(
        `   MTTR Change: ${weeklySnapshot.trends.mttrChange > 0 ? "+" : ""}${weeklySnapshot.trends.mttrChange.toFixed(1)}%`
      );

      if (weeklySnapshot.alerts.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`🚨 Alerts (${weeklySnapshot.alerts.length}):`);
        weeklySnapshot.alerts.forEach((alert) => {
          // eslint-disable-next-line no-console
          console.log(`   [${alert.type.toUpperCase()}] ${alert.message}`);
        });
      } else {
        // eslint-disable-next-line no-console
        console.log(`✅ No alerts - all metrics within normal range`);
      }

      // eslint-disable-next-line no-console
      console.log(`📑 Top Issue Categories:`);
      weeklySnapshot.topCategories
        .slice(0, 5)
        .forEach(
          (
            category: { category: string; count: number; percentage: number },
            idx: number
          ) => {
            // eslint-disable-next-line no-console
            console.log(
              `   ${idx + 1}. ${category.category}: ${category.count} issues (${category.percentage.toFixed(1)}%)`
            );
          }
        );

      const outputDir = path.resolve(__dirname, "../../test-output");
      fs.writeFileSync(
        path.join(outputDir, "weekly-snapshot.json"),
        JSON.stringify(weeklySnapshot, null, 2)
      );
      // eslint-disable-next-line no-console
      console.log(`💾 Saved to: test-output/weekly-snapshot.json\n`);
    } catch (error) {
      console.error("❌ Weekly snapshot failed:", error);
    }

    // eslint-disable-next-line no-console
    console.log("✅ All export and report tests completed!");
    // eslint-disable-next-line no-console
    console.log("📁 Output files saved to: backend/test-output/");
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testExportReports()
  .then(() => {
    // eslint-disable-next-line no-console
    console.log("\n✨ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
