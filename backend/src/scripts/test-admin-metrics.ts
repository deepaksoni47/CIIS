/**
 * Test script for admin metrics
 * Run with: npm run ts-node src/scripts/test-admin-metrics.ts
 */

/* eslint-disable no-console */

import * as admin from "firebase-admin";
import * as analyticsService from "../modules/analytics/analytics.service";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

async function testAdminMetrics() {
  console.log("📊 Testing Admin Metrics...\n");

  try {
    const organizationId = "ggv-university";
    const timeWindowDays = 30;
    const comparisonTimeWindowDays = 30;

    console.log("Parameters:");
    console.log(`- Organization ID: ${organizationId}`);
    console.log(`- Time Window: ${timeWindowDays} days`);
    console.log(`- Comparison Window: ${comparisonTimeWindowDays} days\n`);

    const result = await analyticsService.getAdminMetrics(
      organizationId,
      timeWindowDays,
      comparisonTimeWindowDays
    );

    // ========== MTTR ==========
    console.log("⏱️  MTTR (Mean Time To Resolve):\n");
    console.log(`Overall MTTR: ${result.mttr.overall} hours\n`);

    if (result.mttr.byCategory.length > 0) {
      console.log("By Category:");
      result.mttr.byCategory.slice(0, 5).forEach((cat) => {
        console.log(`  - ${cat.category}: ${cat.mttr}h (${cat.count} issues)`);
      });
      console.log("");
    }

    if (result.mttr.byBuilding.length > 0) {
      console.log("By Building (Top 5):");
      result.mttr.byBuilding.slice(0, 5).forEach((bldg) => {
        console.log(
          `  - ${bldg.buildingName}: ${bldg.mttr}h (${bldg.count} issues)`
        );
      });
      console.log("");
    }

    if (result.mttr.byPriority.length > 0) {
      console.log("By Priority:");
      result.mttr.byPriority.forEach((pri) => {
        console.log(
          `  - ${pri.priority.toUpperCase()}: ${pri.mttr}h (${pri.count} issues)`
        );
      });
      console.log("");
    }

    // ========== High-Risk Buildings ==========
    console.log("🏢 High-Risk Buildings:\n");

    if (result.highRiskBuildings.length > 0) {
      result.highRiskBuildings.slice(0, 5).forEach((building, index) => {
        console.log(`${index + 1}. ${building.buildingName}`);
        console.log(`   Risk Score: ${building.riskScore}`);
        console.log(
          `   Open Issues: ${building.openIssues} (${building.criticalIssues} critical)`
        );
        console.log(`   Avg Severity: ${building.avgSeverity}`);
        console.log(`   Avg Unresolved Age: ${building.unressolvedAge} days`);
        console.log(`   Recurring Issues: ${building.recurringIssues}`);
        console.log(`   Risk Factors:`);
        building.riskFactors.forEach((factor) => {
          console.log(`     ⚠️  ${factor}`);
        });
        console.log("");
      });
    } else {
      console.log("✅ No high-risk buildings identified.\n");
    }

    // ========== Issue Growth Rate ==========
    console.log("📈 Issue Growth Rate:\n");

    console.log("Current Period:");
    console.log(
      `  - Total Issues: ${result.issueGrowthRate.currentPeriod.total}`
    );
    console.log(`  - Open: ${result.issueGrowthRate.currentPeriod.open}`);
    console.log(
      `  - Resolved: ${result.issueGrowthRate.currentPeriod.resolved}`
    );
    console.log(
      `  - Avg/Day: ${result.issueGrowthRate.currentPeriod.avgPerDay}\n`
    );

    if (result.issueGrowthRate.previousPeriod) {
      console.log("Previous Period:");
      console.log(
        `  - Total Issues: ${result.issueGrowthRate.previousPeriod.total}`
      );
      console.log(`  - Open: ${result.issueGrowthRate.previousPeriod.open}`);
      console.log(
        `  - Resolved: ${result.issueGrowthRate.previousPeriod.resolved}`
      );
      console.log(
        `  - Avg/Day: ${result.issueGrowthRate.previousPeriod.avgPerDay}\n`
      );

      const growthIndicator =
        result.issueGrowthRate.growthRate > 0 ? "📈" : "📉";
      console.log(
        `Growth Rate: ${growthIndicator} ${result.issueGrowthRate.growthRate}%\n`
      );
    }

    console.log("Projections:");
    console.log(
      `  - Next Week: ${result.issueGrowthRate.projections.nextWeek} issues`
    );
    console.log(
      `  - Next Month: ${result.issueGrowthRate.projections.nextMonth} issues\n`
    );

    if (result.issueGrowthRate.trend.length > 0) {
      console.log("Recent Trend (Last 7 Days):");
      result.issueGrowthRate.trend.slice(-7).forEach((day) => {
        console.log(
          `  ${day.period}: ${day.total} total (${day.open} open, ${day.resolved} resolved)`
        );
      });
      console.log("");
    }

    // ========== Summary ==========
    console.log("=".repeat(60));
    console.log("\n📋 Summary:\n");

    const avgMTTR = result.mttr.overall;
    const criticalMTTR =
      result.mttr.byPriority.find((p) => p.priority === "critical")?.mttr || 0;
    const highRiskCount = result.highRiskBuildings.length;
    const growthRate = result.issueGrowthRate.growthRate;

    console.log(`✓ Average MTTR: ${avgMTTR} hours`);
    if (criticalMTTR > 0) {
      console.log(`✓ Critical Issues MTTR: ${criticalMTTR} hours`);
    }
    console.log(`✓ High-Risk Buildings: ${highRiskCount}`);
    console.log(
      `✓ Issue Growth Rate: ${growthRate >= 0 ? "+" : ""}${growthRate}%`
    );

    // Performance Indicators
    console.log("\n🎯 Performance Indicators:\n");

    if (avgMTTR < 48) {
      console.log("✅ MTTR is within target (< 48 hours)");
    } else {
      console.log("⚠️  MTTR exceeds target (> 48 hours)");
    }

    if (criticalMTTR > 0 && criticalMTTR < 24) {
      console.log("✅ Critical issues resolved quickly (< 24 hours)");
    } else if (criticalMTTR > 0) {
      console.log("⚠️  Critical issues taking too long (> 24 hours)");
    }

    if (highRiskCount === 0) {
      console.log("✅ No high-risk buildings detected");
    } else if (highRiskCount < 3) {
      console.log("⚠️  Some buildings require attention");
    } else {
      console.log("🚨 Multiple high-risk buildings need immediate action");
    }

    if (Math.abs(growthRate) < 10) {
      console.log("✅ Issue volume is stable");
    } else if (growthRate > 0) {
      console.log("⚠️  Issue volume is increasing");
    } else {
      console.log("✅ Issue volume is decreasing");
    }

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("❌ Error testing admin metrics:", error);
    throw error;
  }
}

// Run the test
testAdminMetrics()
  .then(() => {
    console.log("\n🎉 All tests passed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Test failed:", error);
    process.exit(1);
  });
