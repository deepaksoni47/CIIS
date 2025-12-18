import {
  priorityEngine,
  PriorityInput,
} from "../modules/priority/priority-engine";
import { IssueCategory } from "../types";

/**
 * Test Priority Engine
 * Run: npm run test:priority or tsx src/scripts/test-priority-engine.ts
 */

console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🎯 PRIORITY ENGINE TEST SUITE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Test Scenario 1: Critical Safety Issue
console.log("\n📊 Test 1: Critical Safety Issue - Fire Exit Blocked\n");
const test1: PriorityInput = {
  category: IssueCategory.SAFETY,
  severity: 10,
  reportedAt: new Date(),
  blocksAccess: true,
  safetyRisk: true,
  occupancy: 200,
  affectedArea: 150,
  affectsAcademics: true,
  currentSemester: true,
  timeOfDay: "afternoon",
  examPeriod: true,
};

const result1 = priorityEngine.calculatePriority(test1);
console.log("Input:", JSON.stringify(test1, null, 2));
console.log("\nResult:");
console.log(`  Score: ${result1.score}/100`);
console.log(`  Priority: ${result1.priority.toUpperCase()}`);
console.log(`  Confidence: ${(result1.confidence * 100).toFixed(0)}%`);
console.log(`  Recommended SLA: ${result1.recommendedSLA} hours`);
console.log("\nBreakdown:");
console.log(`  Category: ${result1.breakdown.categoryScore}`);
console.log(`  Severity: ${result1.breakdown.severityScore}`);
console.log(`  Impact: ${result1.breakdown.impactScore}`);
console.log(`  Urgency: ${result1.breakdown.urgencyScore}`);
console.log(`  Context: ${result1.breakdown.contextScore}`);
console.log(`  Historical: ${result1.breakdown.historicalScore}`);
console.log("\nReasoning:");
result1.reasoning.forEach((r) => console.log(`  • ${r}`));

// Test Scenario 2: AC Failure During Exam
console.log("\n\n📊 Test 2: AC Not Working During Exam Period\n");
const test2: PriorityInput = {
  category: IssueCategory.HVAC,
  severity: 7,
  reportedAt: new Date(),
  occupancy: 80,
  affectedArea: 100,
  affectsAcademics: true,
  examPeriod: true,
  currentSemester: true,
  timeOfDay: "morning",
};

const result2 = priorityEngine.calculatePriority(test2);
console.log(
  `Score: ${result2.score} | Priority: ${result2.priority.toUpperCase()} | SLA: ${result2.recommendedSLA}h`
);

// Test Scenario 3: Recurring Network Issue
console.log("\n\n📊 Test 3: Recurring Network Problem\n");
const test3: PriorityInput = {
  category: IssueCategory.NETWORK,
  severity: 6,
  reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  isRecurring: true,
  previousOccurrences: 3,
  occupancy: 150,
  criticalInfrastructure: true,
  escalationRate: 0.6,
  avgResolutionTime: 48,
};

const result3 = priorityEngine.calculatePriority(test3);
console.log(
  `Score: ${result3.score} | Priority: ${result3.priority.toUpperCase()} | SLA: ${result3.recommendedSLA}h`
);
console.log("Key Factors:");
result3.reasoning.forEach((r) => console.log(`  • ${r}`));

// Test Scenario 4: Minor Weekend Issue
console.log("\n\n📊 Test 4: Furniture Damage on Weekend\n");
const test4: PriorityInput = {
  category: IssueCategory.FURNITURE,
  severity: 3,
  reportedAt: new Date(),
  occupancy: 10,
  dayOfWeek: "weekend",
  currentSemester: true,
};

const result4 = priorityEngine.calculatePriority(test4);
console.log(
  `Score: ${result4.score} | Priority: ${result4.priority.toUpperCase()} | SLA: ${result4.recommendedSLA}h`
);

// Test Scenario 5: Power Outage
console.log("\n\n📊 Test 5: Power Outage - Critical Infrastructure\n");
const test5: PriorityInput = {
  category: IssueCategory.ELECTRICAL,
  severity: 9,
  reportedAt: new Date(),
  criticalInfrastructure: true,
  blocksAccess: false,
  occupancy: 300,
  affectedArea: 500,
  affectsAcademics: true,
  currentSemester: true,
};

const result5 = priorityEngine.calculatePriority(test5);
console.log(
  `Score: ${result5.score} | Priority: ${result5.priority.toUpperCase()} | SLA: ${result5.recommendedSLA}h`
);

// Test Scenario 6: Plumbing Issue - No Context
console.log("\n\n📊 Test 6: Basic Plumbing Issue (Minimal Data)\n");
const test6: PriorityInput = {
  category: IssueCategory.PLUMBING,
  reportedAt: new Date(),
};

const result6 = priorityEngine.calculatePriority(test6);
console.log(
  `Score: ${result6.score} | Priority: ${result6.priority.toUpperCase()} | SLA: ${result6.recommendedSLA}h`
);
console.log(
  `Confidence: ${(result6.confidence * 100).toFixed(0)}% (low due to minimal data)`
);

// Test Batch Calculation
console.log("\n\n📊 Test 7: Batch Calculation\n");
const batchInputs = [test1, test2, test3, test4, test5, test6];
const batchResults = priorityEngine.batchCalculate(batchInputs);

console.log("Batch Results Summary:");
batchResults.forEach((result, index) => {
  console.log(
    `  ${index + 1}. ${result.priority.toUpperCase().padEnd(10)} | Score: ${result.score.toString().padStart(3)} | SLA: ${result.recommendedSLA}h`
  );
});

// Test Recalculation
console.log("\n\n📊 Test 8: Context Change - Recalculation\n");
const original: PriorityInput = {
  category: IssueCategory.HVAC,
  severity: 5,
  occupancy: 50,
  reportedAt: new Date(),
  currentSemester: true,
};

const originalResult = priorityEngine.calculatePriority(original);
console.log(
  `Original: Score ${originalResult.score} | Priority: ${originalResult.priority.toUpperCase()}`
);

const updated = priorityEngine.recalculate(original, {
  examPeriod: true,
  occupancy: 150,
  affectsAcademics: true,
});
console.log(
  `Updated:  Score ${updated.score} | Priority: ${updated.priority.toUpperCase()}`
);
console.log(
  `Change:   ${updated.score > originalResult.score ? "+" : ""}${updated.score - originalResult.score} points (${updated.priority !== originalResult.priority ? "PRIORITY ESCALATED!" : "same priority"})`
);

// Summary Statistics
console.log("\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("📈 SUMMARY STATISTICS");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

const allResults = [result1, result2, result3, result4, result5, result6];
const avgScore =
  allResults.reduce((sum, r) => sum + r.score, 0) / allResults.length;
const avgConfidence =
  allResults.reduce((sum, r) => sum + r.confidence, 0) / allResults.length;

const priorityCounts = allResults.reduce(
  (acc, r) => {
    acc[r.priority] = (acc[r.priority] || 0) + 1;
    return acc;
  },
  {} as Record<string, number>
);

console.log(`Average Score: ${avgScore.toFixed(1)}/100`);
console.log(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
console.log("\nPriority Distribution:");
Object.entries(priorityCounts).forEach(([priority, count]) => {
  const percentage = ((count / allResults.length) * 100).toFixed(1);
  console.log(`  ${priority.toUpperCase()}: ${count} (${percentage}%)`);
});

console.log("\n\n✅ All tests completed successfully!\n");

// Export for use in other modules
export { priorityEngine };
