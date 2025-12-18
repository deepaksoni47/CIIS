import { Router } from "express";
import {
  getHeatmap,
  getGeoJSON,
  getClusters,
  getGrid,
  getStats,
  explainAlgorithm,
} from "./heatmap.controller";
import { authenticate } from "../auth/auth.middleware";
import { apiRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { validateHeatmapQuery } from "../../middlewares/validation.middleware";

const router = Router();

/**
 * Get heatmap data with full configuration
 * Query params: organizationId, campusId, buildingIds[], categories[], priorities[], statuses[],
 *               startDate, endDate, minSeverity, maxAge, timeDecayFactor, severityWeightMultiplier,
 *               clusterRadius, minClusterSize, gridSize, normalizeWeights
 */
router.get(
  "/data",
  authenticate,
  apiRateLimiter,
  validateHeatmapQuery,
  getHeatmap
);

/**
 * Get heatmap data in GeoJSON format (simplified)
 * Query params: organizationId, campusId, buildingIds[], categories[],
 *               timeDecayFactor, severityWeightMultiplier
 */
router.get(
  "/geojson",
  authenticate,
  apiRateLimiter,
  validateHeatmapQuery,
  getGeoJSON
);

/**
 * Get clustered heatmap data
 * Query params: organizationId, campusId, buildingIds[], categories[],
 *               clusterRadius (default: 100m), minClusterSize (default: 2)
 */
router.get(
  "/clusters",
  authenticate,
  apiRateLimiter,
  validateHeatmapQuery,
  getClusters
);

/**
 * Get grid-based heatmap data (optimized for performance)
 * Query params: organizationId, campusId, buildingIds[], categories[],
 *               gridSize (default: 100m)
 */
router.get(
  "/grid",
  authenticate,
  apiRateLimiter,
  validateHeatmapQuery,
  getGrid
);

/**
 * Get heatmap statistics
 * Query params: same as /data endpoint
 */
router.get(
  "/stats",
  authenticate,
  apiRateLimiter,
  validateHeatmapQuery,
  getStats
);

/**
 * Get algorithm explanation (public endpoint)
 * No authentication required
 */
router.get("/explain", apiRateLimiter, explainAlgorithm);

export default router;
