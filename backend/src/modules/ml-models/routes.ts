/**
 * ML Models Routes
 * API endpoints for ML model predictions and risk analysis
 */

import { Router } from "express";
import * as mlModelsController from "./ml-models.controller";
import { authenticateUser } from "../../middlewares/auth";

const router = Router();

// Health check - no auth required for system monitoring
router.get("/health", mlModelsController.checkMLHealth);

// Prediction endpoints
router.get(
  "/predictions",
  authenticateUser,
  mlModelsController.getFailurePredictions
);
router.get(
  "/predictions/:buildingId",
  authenticateUser,
  mlModelsController.getBuildingPrediction
);

// Anomaly detection endpoints
router.get("/anomalies", authenticateUser, mlModelsController.getAnomalies);

// Risk scoring endpoints
// Specific routes must come BEFORE parameterized routes
router.get("/risk/report", authenticateUser, mlModelsController.getRiskReport);
router.get(
  "/risk/category",
  authenticateUser,
  mlModelsController.getCategoryRisks
);
router.get(
  "/risk/priority",
  authenticateUser,
  mlModelsController.getPriorityBuildings
);
router.get(
  "/risk/failure",
  authenticateUser,
  mlModelsController.getFailureRisks
);
router.get(
  "/risk/anomaly",
  authenticateUser,
  mlModelsController.getAnomalyRisks
);
router.get(
  "/risk/recency",
  authenticateUser,
  mlModelsController.getRecencyRisks
);
router.get("/risk", authenticateUser, mlModelsController.getRiskScores);
router.get(
  "/risk/:buildingId",
  authenticateUser,
  mlModelsController.getBuildingRisk
);

// Critical status endpoints
router.get(
  "/critical-buildings",
  authenticateUser,
  mlModelsController.getCriticalBuildings
);
router.get(
  "/high-risk-buildings",
  authenticateUser,
  mlModelsController.getHighRiskBuildings
);

export default router;
