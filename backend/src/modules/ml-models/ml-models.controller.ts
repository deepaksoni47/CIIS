/**
 * ML Models Controller
 * REST endpoints for ML model predictions and risk analysis
 */

import { Request, Response } from "express";
import { mlModelsService } from "./ml-models.service";

/**
 * GET /api/ml/health
 * Check if ML models are available
 */
export async function checkMLHealth(req: Request, res: Response) {
  try {
    const isHealthy = await mlModelsService.healthCheck();

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "healthy" : "unavailable",
      timestamp: new Date().toISOString(),
      message: isHealthy
        ? "ML models are available and ready"
        : "ML models are currently unavailable",
    });
  } catch (error) {
    console.error("Error checking ML health:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to check ML models status",
    });
  }
}

/**
 * GET /api/ml/predictions
 * Get all failure predictions
 */
export async function getFailurePredictions(req: Request, res: Response) {
  try {
    const predictions = await mlModelsService.getAllFailurePredictions();

    if (!predictions || predictions.length === 0) {
      return res.status(503).json({
        error: "No predictions available",
        message: "Please ensure ML models are trained",
      });
    }

    const criticalCount = predictions.filter(
      (p) => p.risk_level === "CRITICAL"
    ).length;

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      predictions,
      summary: {
        total_predictions: predictions.length,
        critical_count: criticalCount,
      },
    });
  } catch (error) {
    console.error("Error getting failure predictions:", error);
    return res.status(500).json({
      error: "Failed to retrieve predictions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/predictions/:buildingId
 * Get failure prediction for specific building
 */
export async function getBuildingPrediction(req: Request, res: Response) {
  try {
    const { buildingId } = req.params;

    if (!buildingId) {
      return res.status(400).json({
        error: "Missing buildingId parameter",
      });
    }

    const prediction = await mlModelsService.getFailurePrediction(buildingId);

    if (!prediction) {
      return res.status(404).json({
        error: "Prediction not found",
        buildingId,
      });
    }

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      prediction,
    });
  } catch (error) {
    console.error("Error getting building prediction:", error);
    return res.status(500).json({
      error: "Failed to retrieve prediction",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/anomalies
 * Get detected anomalies
 */
export async function getAnomalies(req: Request, res: Response) {
  try {
    const anomalies = await mlModelsService.getAnomalies();

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      anomalies,
      count: anomalies.length,
    });
  } catch (error) {
    console.error("Error getting anomalies:", error);
    return res.status(500).json({
      error: "Failed to retrieve anomalies",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk
 * Get all building risk scores
 */
export async function getRiskScores(req: Request, res: Response) {
  try {
    const scores = await mlModelsService.getRiskScores();

    if (!scores || scores.length === 0) {
      return res.status(503).json({
        error: "No risk scores available",
        message: "Please ensure ML models are trained",
      });
    }

    const criticalCount = scores.filter(
      (s) => s.risk_level === "CRITICAL"
    ).length;
    const highCount = scores.filter((s) => s.risk_level === "HIGH").length;
    const mediumCount = scores.filter((s) => s.risk_level === "MEDIUM").length;

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      risk_scores: scores,
      summary: {
        total_buildings: scores.length,
        critical_count: criticalCount,
        high_count: highCount,
        medium_count: mediumCount,
        low_count: scores.length - criticalCount - highCount - mediumCount,
        average_risk:
          scores.reduce((sum, s) => sum + s.risk_probability, 0) /
          scores.length,
      },
    });
  } catch (error) {
    console.error("Error getting risk scores:", error);
    return res.status(500).json({
      error: "Failed to retrieve risk scores",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk/failure
 * Get buildings sorted by failure detection model score
 */
export async function getFailureRisks(req: Request, res: Response) {
  try {
    const scores = await mlModelsService.getFailureRisks();
    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      model: "Failure Detection Model",
      scores,
    });
  } catch (error) {
    console.error("Error getting failure risks:", error);
    return res.status(500).json({
      error: "Failed to retrieve failure risks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk/anomaly
 * Get buildings sorted by anomaly detection model score
 */
export async function getAnomalyRisks(req: Request, res: Response) {
  try {
    const scores = await mlModelsService.getAnomalyRisks();
    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      model: "Anomaly Detection Model",
      scores,
    });
  } catch (error) {
    console.error("Error getting anomaly risks:", error);
    return res.status(500).json({
      error: "Failed to retrieve anomaly risks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk/recency
 * Get buildings sorted by recency/time-based model score
 */
export async function getRecencyRisks(req: Request, res: Response) {
  try {
    const scores = await mlModelsService.getRecencyRisks();
    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      model: "Recency/Time-based Model",
      scores,
    });
  } catch (error) {
    console.error("Error getting recency risks:", error);
    return res.status(500).json({
      error: "Failed to retrieve recency risks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk/:buildingId
 * Get risk score for specific building
 */
export async function getBuildingRisk(req: Request, res: Response) {
  try {
    const { buildingId } = req.params;

    if (!buildingId) {
      return res.status(400).json({
        error: "Missing buildingId parameter",
      });
    }

    const risk = await mlModelsService.getBuildingRiskScore(buildingId);

    if (!risk) {
      return res.status(404).json({
        error: "Risk score not found",
        buildingId,
      });
    }

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      risk,
    });
  } catch (error) {
    console.error("Error getting building risk:", error);
    return res.status(500).json({
      error: "Failed to retrieve building risk",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk/category
 * Get risk analysis by category
 */
export async function getCategoryRisks(req: Request, res: Response) {
  try {
    const categoryRisks = await mlModelsService.getCategoryRisks();

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      category_risks: categoryRisks,
      count: categoryRisks.length,
    });
  } catch (error) {
    console.error("Error getting category risks:", error);
    return res.status(500).json({
      error: "Failed to retrieve category risks",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk/priority
 * Get priority-ranked buildings for maintenance
 */
export async function getPriorityBuildings(req: Request, res: Response) {
  try {
    const topN = parseInt(req.query.limit as string) || 10;

    if (topN < 1 || topN > 100) {
      return res.status(400).json({
        error: "Invalid limit parameter",
        message: "Limit must be between 1 and 100",
      });
    }

    const buildings = await mlModelsService.getPriorityBuildings(topN);

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      priority_buildings: buildings,
      count: buildings.length,
    });
  } catch (error) {
    console.error("Error getting priority buildings:", error);
    return res.status(500).json({
      error: "Failed to retrieve priority buildings",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/risk/report
 * Get comprehensive risk report
 */
export async function getRiskReport(req: Request, res: Response) {
  try {
    const report = await mlModelsService.getRiskReport();

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error) {
    console.error("Error getting risk report:", error);
    return res.status(500).json({
      error: "Failed to retrieve risk report",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/critical-buildings
 * Get buildings requiring immediate attention
 */
export async function getCriticalBuildings(req: Request, res: Response) {
  try {
    const criticalBuildings = await mlModelsService.getCriticalBuildings();

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      critical_buildings: criticalBuildings,
      count: criticalBuildings.length,
    });
  } catch (error) {
    console.error("Error getting critical buildings:", error);
    return res.status(500).json({
      error: "Failed to retrieve critical buildings",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * GET /api/ml/high-risk-buildings
 * Get high-risk buildings
 */
export async function getHighRiskBuildings(req: Request, res: Response) {
  try {
    const highRiskBuildings = await mlModelsService.getHighRiskBuildings();

    return res.status(200).json({
      status: "success",
      timestamp: new Date().toISOString(),
      high_risk_buildings: highRiskBuildings,
      count: highRiskBuildings.length,
    });
  } catch (error) {
    console.error("Error getting high-risk buildings:", error);
    return res.status(500).json({
      error: "Failed to retrieve high-risk buildings",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
