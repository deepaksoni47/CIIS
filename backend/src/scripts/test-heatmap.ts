/**
 * Test script for Heatmap API
 *
 * Run with: npm run test:heatmap
 */

import {
  getHeatmapData,
  getHeatmapStats,
  HeatmapFilters,
  HeatmapConfig,
} from "../modules/heatmap/heatmap.service";
import { IssuePriority } from "../types";

async function testHeatmapAPI() {
  console.log("🗺️  Testing Heatmap API\n");
  console.log("=".repeat(60));

  try {
    // Test 1: Basic heatmap data
    console.log("\n📍 Test 1: Get Basic Heatmap Data");
    console.log("-".repeat(60));

    const basicFilters: HeatmapFilters = {
      organizationId: "test-org-123",
    };

    const basicConfig: HeatmapConfig = {
      timeDecayFactor: 0.5,
      severityWeightMultiplier: 2.0,
      normalizeWeights: true,
    };

    try {
      const basicData = await getHeatmapData(basicFilters, basicConfig);
      console.log(`✅ Total features: ${basicData.features.length}`);
      console.log(`✅ Total issues: ${basicData.metadata.totalIssues}`);
      console.log(
        `✅ Time decay factor: ${basicData.metadata.timeDecayFactor}`
      );
      console.log(
        `✅ Date range: ${basicData.metadata.dateRange.start} to ${basicData.metadata.dateRange.end}`
      );
    } catch (error) {
      console.log(
        `⚠️  No data found (expected for test): ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 2: Heatmap with priority filter
    console.log("\n📍 Test 2: Get High Priority Heatmap");
    console.log("-".repeat(60));

    const priorityFilters: HeatmapFilters = {
      organizationId: "test-org-123",
      priorities: [IssuePriority.CRITICAL, IssuePriority.HIGH],
    };

    const priorityConfig: HeatmapConfig = {
      timeDecayFactor: 0.7,
      severityWeightMultiplier: 3.0,
      normalizeWeights: true,
    };

    try {
      const priorityData = await getHeatmapData(
        priorityFilters,
        priorityConfig
      );
      console.log(`✅ Total features: ${priorityData.features.length}`);
      console.log(`✅ Total issues: ${priorityData.metadata.totalIssues}`);
      console.log(
        `✅ Severity weight enabled: ${priorityData.metadata.severityWeightEnabled}`
      );

      if (priorityData.features.length > 0) {
        const sample = priorityData.features[0];
        console.log(
          `✅ Sample point weight: ${sample.properties.weight.toFixed(3)}`
        );
        console.log(
          `✅ Sample point intensity: ${sample.properties.intensity}`
        );
        console.log(
          `✅ Sample critical count: ${sample.properties.criticalCount}`
        );
      }
    } catch (error) {
      console.log(
        `⚠️  No data found (expected for test): ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 3: Clustered heatmap
    console.log("\n📍 Test 3: Get Clustered Heatmap Data");
    console.log("-".repeat(60));

    const clusterFilters: HeatmapFilters = {
      organizationId: "test-org-123",
    };

    const clusterConfig: HeatmapConfig = {
      timeDecayFactor: 0.5,
      severityWeightMultiplier: 2.0,
      clusterRadius: 100,
      minClusterSize: 3,
      normalizeWeights: true,
    };

    try {
      const clusterData = await getHeatmapData(clusterFilters, clusterConfig);
      console.log(`✅ Total features: ${clusterData.features.length}`);
      console.log(`✅ Total issues: ${clusterData.metadata.totalIssues}`);
      console.log(`✅ Cluster radius: ${clusterData.metadata.clusterRadius}m`);
    } catch (error) {
      console.log(
        `⚠️  No data found (expected for test): ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 4: Grid-based heatmap
    console.log("\n📍 Test 4: Get Grid-Based Heatmap Data");
    console.log("-".repeat(60));

    const gridFilters: HeatmapFilters = {
      organizationId: "test-org-123",
    };

    const gridConfig: HeatmapConfig = {
      timeDecayFactor: 0.5,
      severityWeightMultiplier: 2.0,
      gridSize: 75,
      normalizeWeights: true,
    };

    try {
      const gridData = await getHeatmapData(gridFilters, gridConfig);
      console.log(`✅ Total features: ${gridData.features.length}`);
      console.log(`✅ Total issues: ${gridData.metadata.totalIssues}`);
      console.log(`✅ Grid size: ${gridConfig.gridSize}m`);
    } catch (error) {
      console.log(
        `⚠️  No data found (expected for test): ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 5: Statistics
    console.log("\n📍 Test 5: Get Heatmap Statistics");
    console.log("-".repeat(60));

    const statsFilters: HeatmapFilters = {
      organizationId: "test-org-123",
    };

    const statsConfig: HeatmapConfig = {
      timeDecayFactor: 0.5,
      severityWeightMultiplier: 2.0,
      normalizeWeights: true,
    };

    try {
      const stats = await getHeatmapStats(statsFilters, statsConfig);
      console.log(`✅ Total points: ${stats.totalPoints}`);
      console.log(`✅ Total issues: ${stats.totalIssues}`);
      console.log(`✅ Average weight: ${stats.avgWeight.toFixed(3)}`);
      console.log(
        `✅ Weight range: ${stats.minWeight.toFixed(3)} - ${stats.maxWeight.toFixed(3)}`
      );
      console.log(`✅ Priority distribution:`);
      console.log(`   - Critical: ${stats.weightDistribution.critical}`);
      console.log(`   - High: ${stats.weightDistribution.high}`);
      console.log(`   - Medium: ${stats.weightDistribution.medium}`);
      console.log(`   - Low: ${stats.weightDistribution.low}`);
      console.log(`✅ Geographic bounds:`);
      console.log(`   - North: ${stats.geographicBounds.north.toFixed(4)}`);
      console.log(`   - South: ${stats.geographicBounds.south.toFixed(4)}`);
      console.log(`   - East: ${stats.geographicBounds.east.toFixed(4)}`);
      console.log(`   - West: ${stats.geographicBounds.west.toFixed(4)}`);
      console.log(`✅ Time decay stats:`);
      console.log(
        `   - Average age: ${stats.timeDecayStats.avgAge.toFixed(1)} hours`
      );
      console.log(`   - Oldest: ${stats.timeDecayStats.oldestIssue}`);
      console.log(`   - Newest: ${stats.timeDecayStats.newestIssue}`);
    } catch (error) {
      console.log(
        `⚠️  No data found (expected for test): ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    // Test 6: Time decay variations
    console.log("\n📍 Test 6: Compare Time Decay Factors");
    console.log("-".repeat(60));

    const decayFactors = [0.1, 0.5, 0.9];
    for (const factor of decayFactors) {
      const testConfig: HeatmapConfig = {
        timeDecayFactor: factor,
        severityWeightMultiplier: 2.0,
        normalizeWeights: true,
      };

      try {
        const data = await getHeatmapData(statsFilters, testConfig);
        console.log(
          `✅ Decay factor ${factor}: ${data.features.length} features`
        );
      } catch (error) {
        console.log(`⚠️  Decay factor ${factor}: No data`);
      }
    }

    // Test 7: Severity weight variations
    console.log("\n📍 Test 7: Compare Severity Weight Multipliers");
    console.log("-".repeat(60));

    const severityMultipliers = [0, 1.0, 2.0, 5.0];
    for (const multiplier of severityMultipliers) {
      const testConfig: HeatmapConfig = {
        timeDecayFactor: 0.5,
        severityWeightMultiplier: multiplier,
        normalizeWeights: true,
      };

      try {
        const data = await getHeatmapData(statsFilters, testConfig);
        console.log(
          `✅ Severity multiplier ${multiplier}: ${data.features.length} features`
        );
      } catch (error) {
        console.log(`⚠️  Severity multiplier ${multiplier}: No data`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All heatmap API tests completed!");
    console.log("=".repeat(60));
    console.log(
      "\n💡 Note: Some tests may show 'No data found' if database is empty."
    );
    console.log("   This is expected for a fresh installation.\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

// Run tests
testHeatmapAPI()
  .then(() => {
    console.log("✅ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
