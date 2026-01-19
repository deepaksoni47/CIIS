/**
 * ML Models Module
 * Exports ML service and types for use throughout the application
 */

export { mlModelsService } from "./ml-models.service";
export type {
  PredictionResult,
  AnomalyResult,
  RiskScore,
  CategoryRisk,
  ZoneRisk,
  RiskReport,
} from "./ml-models.service";

export * as mlModelsController from "./ml-models.controller";
