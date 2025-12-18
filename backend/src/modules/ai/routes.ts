import { Router } from "express";
import * as aiController from "./ai.controller";
import { aiRateLimiter } from "../../middlewares/rateLimiter.middleware";
import { validateId } from "../../middlewares/validation.middleware";
import { body } from "express-validator";
import { handleValidationErrors } from "../../middlewares/validation.middleware";

const router = Router();

/**
 * @route   GET /api/ai/insights
 * @desc    Generate general AI insights from recent issues
 * @access  Public
 */
router.get("/insights", aiRateLimiter, aiController.generateGeneralInsights);

/**
 * @route   GET /api/ai/risk/:buildingId
 * @desc    Generate risk assessment for a specific building
 * @access  Public
 */
router.get(
  "/risk/:buildingId",
  aiRateLimiter,
  validateId("buildingId"),
  aiController.generateBuildingRisk
);

/**
 * @route   GET /api/ai/summary/:issueId
 * @desc    Generate AI summary for a specific issue
 * @access  Public
 */
router.get(
  "/summary/:issueId",
  aiRateLimiter,
  validateId("issueId"),
  aiController.generateIssueSummary
);

/**
 * @route   GET /api/ai/suggestions
 * @desc    Get maintenance suggestions (query params: category, severity)
 * @access  Public
 */
router.get(
  "/suggestions",
  aiRateLimiter,
  aiController.getMaintenanceSuggestions
);

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI assistant
 * @access  Public
 */
router.post(
  "/chat",
  aiRateLimiter,
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ min: 1, max: 2000 })
    .withMessage("Message must be between 1 and 2000 characters"),
  body("conversationId")
    .optional()
    .trim()
    .isLength({ max: 128 })
    .withMessage("Invalid conversation ID"),
  handleValidationErrors,
  aiController.chatWithAI
);

export default router;
