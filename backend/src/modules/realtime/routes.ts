import { Router } from "express";
import {
  streamHeatmapUpdates,
  streamIssueUpdates,
  getSSEStats,
} from "../../services/sse.service";
import { authenticate } from "../auth/auth.middleware";
import {
  realtimeRateLimiter,
  apiRateLimiter,
} from "../../middlewares/rateLimiter.middleware";
import { validateRealtimeQuery } from "../../middlewares/validation.middleware";

const router = Router();

/**
 * Stream heatmap updates via Server-Sent Events
 * GET /api/realtime/heatmap/stream
 *
 * Query params:
 * - organizationId* (required)
 * - campusId
 * - buildingIds[]
 * - categories[]
 * - updateInterval (default: 30000ms)
 */
router.get(
  "/heatmap/stream",
  authenticate,
  realtimeRateLimiter,
  validateRealtimeQuery,
  streamHeatmapUpdates
);

/**
 * Stream issue updates via Server-Sent Events
 * GET /api/realtime/issues/stream
 *
 * Query params:
 * - organizationId* (required)
 * - campusId
 * - buildingId
 * - priorities[]
 * - statuses[]
 */
router.get(
  "/issues/stream",
  authenticate,
  realtimeRateLimiter,
  validateRealtimeQuery,
  streamIssueUpdates
);

/**
 * Get SSE connection statistics
 * GET /api/realtime/stats
 *
 * Query params:
 * - organizationId (optional)
 */
router.get("/stats", authenticate, apiRateLimiter, getSSEStats);

export default router;
