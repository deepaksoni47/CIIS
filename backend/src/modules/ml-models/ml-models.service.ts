/**
 * ML Models Service
 * Integration with Python ML models for failure prediction, anomaly detection, and risk probability
 */

import axios, { AxiosInstance } from "axios";
import { getFirestore } from "../../config/firebase";

interface PredictionResult {
  building_id: string;
  failure_probability: number;
  time_window_days?: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  confidence: number;
  features_used?: string[];
}

interface AnomalyResult {
  building_id: string;
  anomaly_probability: number;
  anomaly_type: "isolation_forest" | "one_class_svm" | "ensemble";
  is_anomalous: boolean;
  risk_level: string;
}

interface RiskScore {
  building_id: string;
  building_name?: string;
  risk_probability: number;
  risk_level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  failure_score: number | null;
  anomaly_score: number | null;
  recency_score: number | null;
  recent_critical_issues?: number; // For priority buildings sorting
  recommendations?: string[];
}

interface CategoryRisk {
  category: string;
  risk_score: number;
  num_issues: number;
  avg_severity: number;
  risk_level: string;
}

interface ZoneRisk {
  zone: string;
  avg_risk: number;
  max_risk: number;
  critical_count: number;
  high_count: number;
  median_risk: number;
}

interface RiskReport {
  timestamp: string;
  executive_summary: {
    total_buildings: number;
    critical: number;
    high: number;
    average_risk: number;
    highest_risk_building: string;
  };
  recommendations: Array<{
    priority: number;
    action: string;
    expected_savings?: string;
  }>;
}

class MLModelsService {
  private apiClient: AxiosInstance;
  private mlApiUrl: string;
  private isHealthy: boolean = false;
  private healthPaths: string[] = ["/api/ml/health", "/api/health", "/health"];
  private buildingsCache: Map<string, string> = new Map(); // Map building ID to name
  private buildingsCacheTTL: number = 0; // Cache timestamp

  constructor() {
    this.mlApiUrl = process.env.ML_API_URL || "http://127.0.0.1:5000";

    const timeout = process.env.ML_API_TIMEOUT_MS
      ? Number(process.env.ML_API_TIMEOUT_MS)
      : 30000;

    // Configure health paths from env (single or CSV)
    if (process.env.ML_API_HEALTH_PATH) {
      this.healthPaths = [process.env.ML_API_HEALTH_PATH];
    } else if (process.env.ML_API_HEALTH_PATHS) {
      this.healthPaths = process.env.ML_API_HEALTH_PATHS.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const defaultHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.ML_API_KEY) {
      defaultHeaders["X-API-Key"] = process.env.ML_API_KEY;
    }

    this.apiClient = axios.create({
      baseURL: this.mlApiUrl,
      timeout,
      headers: defaultHeaders,
    });
  }

  /**
   * Check if ML API is healthy
   */
  async healthCheck(): Promise<boolean> {
    // Try configured/common health endpoints exposed by the ML API
    const tryPaths = this.healthPaths;

    for (const path of tryPaths) {
      try {
        const response = await this.apiClient.get(path);
        this.isHealthy = response.status === 200;
        if (this.isHealthy) return true;
      } catch (error: any) {
        // continue to next path if 404; otherwise break
        if (error?.response?.status !== 404) {
          console.warn(`ML API health check failed on ${path}:`, error);
          this.isHealthy = false;
          return false;
        }
      }
    }

    this.isHealthy = false;
    return false;
  }

  /**
   * Get failure predictions for a building
   */
  async getFailurePrediction(
    buildingId: string
  ): Promise<PredictionResult | null> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/predictions");
      const predictions = response.data.predictions || [];

      const prediction = predictions.find(
        (p: any) => p.building_id === buildingId
      );

      if (!prediction) {
        return null;
      }

      return {
        building_id: prediction.building_id,
        failure_probability: prediction.failure_probability,
        time_window_days: prediction.time_window_days,
        risk_level: this.mapRiskLevel(prediction.failure_probability),
        confidence: prediction.confidence || 0.85,
        features_used: prediction.features_used,
      };
    } catch (error) {
      console.error("Error getting failure prediction:", error);
      return null;
    }
  }

  /**
   * Get all failure predictions
   */
  async getAllFailurePredictions(): Promise<PredictionResult[]> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/predictions");
      return (response.data.predictions || []).map((p: any) => ({
        building_id: p.building_id,
        failure_probability: p.failure_probability,
        time_window_days: p.time_window_days,
        risk_level: this.mapRiskLevel(p.failure_probability),
        confidence: p.confidence || 0.85,
      }));
    } catch (error) {
      console.error("Error getting all failure predictions:", error);
      return [];
    }
  }

  /**
   * Get anomaly detection results
   */
  async getAnomalies(): Promise<AnomalyResult[]> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/anomalies");
      return (response.data.anomalies || []).map((a: any) => ({
        building_id: a.building_id,
        anomaly_probability: a.anomaly_probability,
        anomaly_type: a.anomaly_type || "ensemble",
        is_anomalous: a.is_anomalous,
        risk_level: a.risk_level,
      }));
    } catch (error) {
      console.error("Error getting anomalies:", error);
      return [];
    }
  }

  /**
   * Get spike anomalies
   */
  async getSpikeAnomalies(): Promise<AnomalyResult[]> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/anomalies/spikes");
      return (response.data.spikes || []).map((a: any) => ({
        building_id: a.building_id,
        anomaly_probability: a.anomaly_probability,
        anomaly_type: "isolation_forest",
        is_anomalous: true,
        risk_level: a.risk_level,
      }));
    } catch (error) {
      console.error("Error getting spike anomalies:", error);
      return [];
    }
  }

  /**
   * Get all building risk scores
   * Deduplicates results by building_name and aggregates scores (averaging risk_probability)
   */
  async getRiskScores(): Promise<RiskScore[]> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/risk");

      let scores = (response.data.risk_scores || []).map((r: any) => ({
        building_id: r.building_id,
        building_name: r.building_name || r.building_id,
        risk_probability: r.risk_probability,
        risk_level: r.risk_level,
        failure_score:
          r.failure_component != null && !isNaN(r.failure_component)
            ? r.failure_component
            : null,
        anomaly_score:
          r.anomaly_component != null && !isNaN(r.anomaly_component)
            ? r.anomaly_component
            : null,
        recency_score:
          r.recency_component != null && !isNaN(r.recency_component)
            ? r.recency_component
            : null,
      }));

      // Enrich with building names
      scores = await this.enrichBuildingNames(scores);

      // Deduplicate by building_name and aggregate scores
      // Since Flask returns 20 building_X but we have 8 actual buildings,
      // we group by building_name and average the risk_probability
      const buildingMap = new Map<string, RiskScore>();
      const countMap = new Map<string, number>();

      for (const score of scores) {
        const key = score.building_name || score.building_id;

        if (buildingMap.has(key)) {
          // Aggregate: add to existing
          const existing = buildingMap.get(key)!;
          const count = countMap.get(key) || 1;

          existing.risk_probability =
            (existing.risk_probability * count + score.risk_probability) /
            (count + 1);

          // Keep the first non-null component scores
          if (existing.failure_score === null && score.failure_score !== null) {
            existing.failure_score = score.failure_score;
          }
          if (existing.anomaly_score === null && score.anomaly_score !== null) {
            existing.anomaly_score = score.anomaly_score;
          }
          if (existing.recency_score === null && score.recency_score !== null) {
            existing.recency_score = score.recency_score;
          }

          countMap.set(key, count + 1);
        } else {
          // First occurrence
          buildingMap.set(key, score);
          countMap.set(key, 1);
        }
      }

      // Recalculate risk_level based on aggregated probability
      const deduplicatedScores = Array.from(buildingMap.values()).map(
        (score) => {
          const prob = score.risk_probability;
          if (prob >= 70) {
            score.risk_level = "CRITICAL";
          } else if (prob >= 50) {
            score.risk_level = "HIGH";
          } else if (prob >= 30) {
            score.risk_level = "MEDIUM";
          } else {
            score.risk_level = "LOW";
          }
          return score;
        }
      );

      // Sort by risk_probability descending
      deduplicatedScores.sort(
        (a, b) => b.risk_probability - a.risk_probability
      );

      return deduplicatedScores;
    } catch (error) {
      console.error("Error getting risk scores:", error);
      return [];
    }
  }

  /**
   * Get risk score for a specific building
   */
  async getBuildingRiskScore(buildingId: string): Promise<RiskScore | null> {
    try {
      const scores = await this.getRiskScores();
      return scores.find((s) => s.building_id === buildingId) || null;
    } catch (error) {
      console.error(
        `Error getting risk score for building ${buildingId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get buildings sorted by failure component score (Failure Detection Model)
   */
  async getFailureRisks(): Promise<RiskScore[]> {
    try {
      const scores = await this.getRiskScores();
      return scores.sort(
        (a, b) => (b.failure_score || 0) - (a.failure_score || 0)
      );
    } catch (error) {
      console.error("Error getting failure risks:", error);
      return [];
    }
  }

  /**
   * Get buildings sorted by anomaly component score (Anomaly Detection Model)
   */
  async getAnomalyRisks(): Promise<RiskScore[]> {
    try {
      const scores = await this.getRiskScores();
      return scores.sort(
        (a, b) => (b.anomaly_score || 0) - (a.anomaly_score || 0)
      );
    } catch (error) {
      console.error("Error getting anomaly risks:", error);
      return [];
    }
  }

  /**
   * Get buildings sorted by recency component score (Recency/Time-based Model)
   */
  async getRecencyRisks(): Promise<RiskScore[]> {
    try {
      const scores = await this.getRiskScores();
      return scores.sort(
        (a, b) => (b.recency_score || 0) - (a.recency_score || 0)
      );
    } catch (error) {
      console.error("Error getting recency risks:", error);
      return [];
    }
  }

  /**
   * Get category-specific risk analysis
   */
  async getCategoryRisks(): Promise<CategoryRisk[]> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/risk/category");
      return (response.data.category_risks || []).map((c: any) => ({
        category: c.category,
        risk_score: c.category_risk_score,
        risk_level:
          c.category_risk_score > 0.7
            ? "CRITICAL"
            : c.category_risk_score > 0.5
              ? "HIGH"
              : "MEDIUM",
        num_issues: c.total_issues,
        critical_issues: c.critical_issues,
        recent_issue_count: c.recent_issue_count,
        avg_severity: c.avg_resolution_days, // Use resolution days as severity proxy
      }));
    } catch (error) {
      console.error("Error getting category risks:", error);
      return [];
    }
  }

  /**
   * Get zone-level risk aggregation
   */
  async getZoneRisks(): Promise<ZoneRisk[]> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/risk/zones");
      return response.data.zone_risks || [];
    } catch (error) {
      console.error("Error getting zone risks:", error);
      return [];
    }
  }

  /**
   * Get top priority buildings
   * Uses the same /api/ml/risk endpoint as getRiskScores() for consistent scoring
   * Returns top N buildings sorted by risk_probability (descending)
   */
  async getPriorityBuildings(topN: number = 10): Promise<RiskScore[]> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      // Use the same /api/ml/risk endpoint for consistent scores with getRiskScores()
      const response = await this.apiClient.get("/api/ml/risk");

      let scores = (response.data.risk_scores || []).map((r: any) => ({
        building_id: r.building_id,
        building_name: r.building_name || r.building_id,
        risk_probability: r.risk_probability,
        risk_level: r.risk_level,
        failure_score:
          r.failure_component != null && !isNaN(r.failure_component)
            ? r.failure_component
            : null,
        anomaly_score:
          r.anomaly_component != null && !isNaN(r.anomaly_component)
            ? r.anomaly_component
            : null,
        recency_score:
          r.recency_component != null && !isNaN(r.recency_component)
            ? r.recency_component
            : null,
      }));

      // Enrich with building names
      scores = await this.enrichBuildingNames(scores);

      // Deduplicate by building_name and aggregate scores
      const buildingMap = new Map<string, RiskScore>();
      const countMap = new Map<string, number>();

      for (const score of scores) {
        const key = score.building_name || score.building_id;

        if (buildingMap.has(key)) {
          // Aggregate: add to existing
          const existing = buildingMap.get(key)!;
          const count = countMap.get(key) || 1;

          existing.risk_probability =
            (existing.risk_probability * count + score.risk_probability) /
            (count + 1);

          // Keep the first non-null component scores
          if (existing.failure_score === null && score.failure_score !== null) {
            existing.failure_score = score.failure_score;
          }
          if (existing.anomaly_score === null && score.anomaly_score !== null) {
            existing.anomaly_score = score.anomaly_score;
          }
          if (existing.recency_score === null && score.recency_score !== null) {
            existing.recency_score = score.recency_score;
          }

          countMap.set(key, count + 1);
        } else {
          // First occurrence
          buildingMap.set(key, score);
          countMap.set(key, 1);
        }
      }

      // Recalculate risk_level based on aggregated probability
      const deduplicatedScores = Array.from(buildingMap.values()).map(
        (score) => {
          const prob = score.risk_probability;
          if (prob >= 70) {
            score.risk_level = "CRITICAL";
          } else if (prob >= 50) {
            score.risk_level = "HIGH";
          } else if (prob >= 30) {
            score.risk_level = "MEDIUM";
          } else {
            score.risk_level = "LOW";
          }
          return score;
        }
      );

      // Sort by risk_probability descending
      deduplicatedScores.sort(
        (a, b) => b.risk_probability - a.risk_probability
      );

      return deduplicatedScores.slice(0, topN);
    } catch (error) {
      console.error("Error getting priority buildings:", error);
      return [];
    }
  }

  /**
   * Get comprehensive risk report
   */
  async getRiskReport(): Promise<RiskReport | null> {
    try {
      if (!this.isHealthy) {
        await this.healthCheck();
      }

      const response = await this.apiClient.get("/api/ml/risk/report");
      return response.data.report || null;
    } catch (error) {
      console.error("Error getting risk report:", error);
      return null;
    }
  }

  /**
   * Save prediction results to Firestore
   */
  async savePredictionResults(buildingId: string, results: PredictionResult) {
    try {
      const db = getFirestore();
      const timestamp = new Date();
      await db.collection("ml_predictions").add({
        building_id: buildingId,
        failure_probability: results.failure_probability,
        time_window_days: results.time_window_days,
        risk_level: results.risk_level,
        confidence: results.confidence,
        created_at: timestamp,
        updated_at: timestamp,
      });

      console.log(`Prediction results saved for building ${buildingId}`);
    } catch (error) {
      console.error("Error saving prediction results:", error);
    }
  }

  /**
   * Save risk scores to Firestore
   */
  async saveRiskScores(scores: RiskScore[]) {
    try {
      const db = getFirestore();
      const timestamp = new Date();
      const batch = db.batch();

      for (const score of scores) {
        const docRef = db.collection("risk_scores").doc(score.building_id);
        batch.set(docRef, {
          building_id: score.building_id,
          risk_probability: score.risk_probability,
          risk_level: score.risk_level,
          failure_score: score.failure_score,
          anomaly_score: score.anomaly_score,
          recency_score: score.recency_score,
          created_at: timestamp,
          updated_at: timestamp,
        });
      }

      await batch.commit();
      console.log(`Saved ${scores.length} risk scores to Firestore`);
    } catch (error) {
      console.error("Error saving risk scores:", error);
    }
  }

  /**
   * Get critical buildings requiring immediate attention
   */
  async getCriticalBuildings(): Promise<RiskScore[]> {
    try {
      const scores = await this.getRiskScores();
      return scores.filter((s) => s.risk_level === "CRITICAL");
    } catch (error) {
      console.error("Error getting critical buildings:", error);
      return [];
    }
  }

  /**
   * Get high-risk buildings
   */
  async getHighRiskBuildings(): Promise<RiskScore[]> {
    try {
      const scores = await this.getRiskScores();
      return scores.filter((s) => s.risk_level === "HIGH");
    } catch (error) {
      console.error("Error getting high-risk buildings:", error);
      return [];
    }
  }

  /**
   * Helper to generate readable building name from ID
   */
  private generateBuildingName(buildingId: string): string {
    // Convert building_12 -> Building 12
    return buildingId
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  /**
   * Fetch all buildings from Firestore and cache them
   * Maps Flask building_X (0-19) to Firestore buildings by cycling through available buildings
   */
  private async fetchAndCacheBuildingsMap(): Promise<Map<string, string>> {
    const now = Date.now();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Return cached if still valid
    if (
      this.buildingsCache.size > 0 &&
      now - this.buildingsCacheTTL < CACHE_DURATION
    ) {
      return this.buildingsCache;
    }

    try {
      const db = getFirestore();
      const snapshot = await db.collection("buildings").get();

      this.buildingsCache.clear();
      const allBuildings: Array<{ id: string; name: string }> = [];

      snapshot.forEach((doc) => {
        const data = doc.data();
        const name = data?.name || data?.building_name || doc.id;
        allBuildings.push({ id: doc.id, name });
      });

      // Fixed list of Firestore building IDs in order
      const buildingIdOrder = [
        "bldg-engineering",
        "bldg-science",
        "bldg-library",
        "bldg-admin",
        "bldg-hostel-boys",
        "bldg-hostel-girls",
        "bldg-auditorium",
        "bldg-sports",
      ];

      // Create intelligent mapping from Flask building_X to Firestore building names
      // Since we have 8 buildings in Firestore and Flask has 20 building_X,
      // we cycle through the available buildings
      for (let i = 0; i < 20; i++) {
        const flaskId = `building_${i}`;
        const buildingId = buildingIdOrder[i % buildingIdOrder.length];
        const building = allBuildings.find((b) => b.id === buildingId);
        if (building) {
          this.buildingsCache.set(flaskId, building.name);
        }
      }

      // Also store by Firestore ID for direct lookups
      allBuildings.forEach((b) => {
        this.buildingsCache.set(b.id, b.name);
      });

      this.buildingsCacheTTL = now;
      console.log(
        `Cached ${this.buildingsCache.size} building mappings from Firestore (8 buildings cycling to 20 Flask building_X)`
      );
    } catch (error) {
      console.warn("Failed to fetch buildings from Firestore:", error);
    }

    return this.buildingsCache;
  }

  /**
   * Helper to enrich scores with building names from Firestore
   */
  private async enrichBuildingNames(scores: RiskScore[]): Promise<RiskScore[]> {
    const db = getFirestore();
    const buildingsMap = await this.fetchAndCacheBuildingsMap();

    for (let score of scores) {
      if (score.building_name === score.building_id) {
        try {
          // First, try to find in cached map by direct lookup
          if (buildingsMap.has(score.building_id)) {
            score.building_name =
              buildingsMap.get(score.building_id) || score.building_id;
            continue;
          }

          // Try exact Firestore lookup
          let docSnap = await db
            .collection("buildings")
            .doc(score.building_id)
            .get();

          // If not found, try common variations
          if (!docSnap.exists) {
            const variations = [
              score.building_id.replace("building_", "bldg-"),
              score.building_id.replace("building_", "BLDG-"),
              score.building_id.toUpperCase(),
              score.building_id.replace("_", "-"),
            ];

            for (const variant of variations) {
              docSnap = await db.collection("buildings").doc(variant).get();
              if (docSnap.exists) break;
            }
          }

          if (docSnap.exists) {
            const data = docSnap.data();
            score.building_name =
              data?.name ||
              data?.building_name ||
              this.generateBuildingName(score.building_id);
          } else {
            // Last resort: search all buildings for a name that contains the building number
            const buildingNum = score.building_id.replace(/\D/g, "");
            let foundName = null;

            for (const [, name] of buildingsMap) {
              if (buildingNum && name.toLowerCase().includes(buildingNum)) {
                foundName = name;
                break;
              }
            }

            score.building_name =
              foundName || this.generateBuildingName(score.building_id);
          }
        } catch (error) {
          console.warn(
            `Could not fetch building name for ${score.building_id}:`,
            error
          );
          score.building_name = this.generateBuildingName(score.building_id);
        }
      }
    }
    return scores;
  }

  /**
   * Calculate maintenance priority score
   */
  calculatePriorityScore(risk: RiskScore): number {
    const levelWeights = {
      CRITICAL: 100,
      HIGH: 75,
      MEDIUM: 50,
      LOW: 25,
    };

    return (
      levelWeights[risk.risk_level] +
      risk.risk_probability * 50 +
      (risk.failure_score * 30 || 0)
    );
  }
}

// Export singleton instance
export const mlModelsService = new MLModelsService();

// Export types
export type {
  PredictionResult,
  AnomalyResult,
  RiskScore,
  CategoryRisk,
  ZoneRisk,
  RiskReport,
};
