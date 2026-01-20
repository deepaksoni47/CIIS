/**
 * Test ML API responses
 * Debugs what Flask is actually returning
 */

import axios from "axios";

async function testFlaskAPI() {
  console.log("\n🧪 Testing Flask ML API Responses\n");

  const mlApiUrl = "http://127.0.0.1:5000";

  try {
    // Test 1: Health check
    console.log("1️⃣  Health Check");
    try {
      const health = await axios.get(`${mlApiUrl}/api/ml/health`, {
        timeout: 5000,
      });
      console.log("✓ Flask is healthy:", health.data);
    } catch (e: any) {
      console.log(
        "✗ Flask not responding:",
        e.message || e.code || "Unknown error"
      );
      return;
    }

    // Test 2: Predictions
    console.log("\n2️⃣  Predictions");
    try {
      const predictions = await axios.get(`${mlApiUrl}/api/ml/predictions`, {
        timeout: 10000,
      });
      console.log(
        "Total predictions:",
        predictions.data.predictions?.length || 0
      );
      if (predictions.data.predictions && predictions.data.predictions[0]) {
        console.log("Sample prediction:", predictions.data.predictions[0]);
        console.log(
          "Failure probabilities (first 3):",
          predictions.data.predictions.slice(0, 3).map((p: any) => ({
            building_id: p.building_id,
            failure_probability: p.failure_probability,
          }))
        );
      }
    } catch (e: any) {
      console.log("✗ Error getting predictions:", e.message);
    }

    // Test 3: Risk scores (the important one)
    console.log("\n3️⃣  Risk Scores (what frontend uses)");
    try {
      const risk = await axios.get(`${mlApiUrl}/api/ml/risk`, {
        timeout: 10000,
      });
      console.log("Total risk scores:", risk.data.risk_scores?.length || 0);

      if (risk.data.risk_scores && risk.data.risk_scores[0]) {
        console.log("\n📊 First 3 buildings:");
        risk.data.risk_scores.slice(0, 3).forEach((r: any, idx: number) => {
          console.log(`\nBuilding ${idx + 1}: ${r.building_id}`);
          console.log(
            `  Risk Probability: ${(r.risk_probability * 100).toFixed(1)}%`
          );
          console.log(
            `  Failure Component: ${(r.failure_component * 100).toFixed(1)}%`
          );
          console.log(
            `  Anomaly Component: ${(r.anomaly_component * 100).toFixed(1)}%`
          );
          console.log(
            `  Recency Component: ${(r.recency_component * 100).toFixed(1)}%`
          );
        });

        // Analyze the pattern
        console.log("\n📈 Analysis:");
        const uniqueRecency = new Set(
          risk.data.risk_scores.map((r: any) => r.recency_component.toFixed(2))
        );
        const uniqueFailure = new Set(
          risk.data.risk_scores.map((r: any) => r.failure_component.toFixed(2))
        );
        console.log(
          `Unique recency values: ${uniqueRecency.size} (${Array.from(uniqueRecency).join(", ")})`
        );
        console.log(
          `Unique failure values: ${uniqueFailure.size} (${Array.from(uniqueFailure).join(", ")})`
        );
      }
    } catch (e: any) {
      console.log("✗ Error getting risk scores:", e.message);
    }

    // Test 4: Anomalies
    console.log("\n4️⃣  Anomalies");
    try {
      const anomalies = await axios.get(`${mlApiUrl}/api/ml/anomalies`, {
        timeout: 10000,
      });
      console.log(
        "Total anomalies detected:",
        anomalies.data.anomalies?.length || 0
      );
      if (anomalies.data.anomalies && anomalies.data.anomalies[0]) {
        console.log("Sample anomaly:", anomalies.data.anomalies[0]);
      }
    } catch (e: any) {
      console.log("✗ Error getting anomalies:", e.message);
    }
  } catch (e) {
    console.error("Unexpected error:", e);
  }
}

testFlaskAPI().catch(console.error);
