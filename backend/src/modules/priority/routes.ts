import { Router } from "express";
import * as priorityController from "./priority.controller";
import { authenticate } from "../auth/auth.middleware";
import { apiRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { validatePriorityInput } from "../../middlewares/validation.middleware";

const router = Router();

/**
 * @route   POST /api/priority/calculate
 * @desc    Calculate priority score for a single issue
 * @access  Private (All authenticated users)
 */
router.post(
  "/calculate",
  authenticate,
  apiRateLimiter,
  validatePriorityInput,
  priorityController.calculatePriorityScore
);

/**
 * @route   POST /api/priority/batch
 * @desc    Batch calculate priority scores
 * @access  Private (All authenticated users)
 */
router.post(
  "/batch",
  authenticate,
  apiRateLimiter,
  priorityController.batchCalculatePriority
);

/**
 * @route   POST /api/priority/recalculate
 * @desc    Recalculate priority with updated context
 * @access  Private (All authenticated users)
 */
router.post(
  "/recalculate",
  authenticate,
  apiRateLimiter,
  validatePriorityInput,
  priorityController.recalculatePriority
);

/**
 * @route   GET /api/priority/explain
 * @desc    Get priority scoring algorithm explanation
 * @access  Public
 */
router.get(
  "/explain",
  apiRateLimiter,
  priorityController.explainPriorityScoring
);

/**
 * @route   POST /api/priority/simulate
 * @desc    Simulate priority scores for test scenarios
 * @access  Private (All authenticated users)
 */
router.post(
  "/simulate",
  authenticate,
  apiRateLimiter,
  validatePriorityInput,
  priorityController.simulatePriorityScores
);

export default router;
