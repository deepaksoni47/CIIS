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

/**
 * @route   POST /api/ai/classify-text
 * @desc    Classify issue from text input with structured JSON output
 * @access  Public
 */
router.post(
  "/classify-text",
  aiRateLimiter,
  body("text")
    .trim()
    .notEmpty()
    .withMessage("Text is required")
    .isLength({ min: 10, max: 5000 })
    .withMessage("Text must be between 10 and 5000 characters"),
  body("buildingName").optional().trim(),
  body("zone").optional().trim(),
  body("reporterName").optional().trim(),
  handleValidationErrors,
  aiController.classifyTextIssue
);

/**
 * @route   POST /api/ai/process-voice
 * @desc    Process voice input (speech-to-text + intent extraction)
 * @access  Public
 */
router.post(
  "/process-voice",
  aiRateLimiter,
  body("audioBase64")
    .trim()
    .notEmpty()
    .withMessage("Audio data (base64) is required"),
  body("mimeType")
    .optional()
    .trim()
    .isIn(["audio/mp3", "audio/wav", "audio/webm"]),
  body("buildingName").optional().trim(),
  body("zone").optional().trim(),
  body("reporterName").optional().trim(),
  handleValidationErrors,
  aiController.processVoice
);

/**
 * @route   POST /api/ai/analyze-image
 * @desc    Analyze infrastructure issue from image
 * @access  Public
 */
router.post(
  "/analyze-image",
  aiRateLimiter,
  body("imageUrl")
    .trim()
    .notEmpty()
    .withMessage("Image URL is required")
    .isURL(),
  body("expectedCategory").optional().trim(),
  body("buildingName").optional().trim(),
  body("additionalContext").optional().trim().isLength({ max: 500 }),
  handleValidationErrors,
  aiController.analyzeImage
);

/**
 * @route   GET /api/ai/daily-summary
 * @desc    Generate daily issue summary for administrators
 * @access  Public
 */
router.get("/daily-summary", aiRateLimiter, aiController.getDailySummary);

/**
 * @route   POST /api/ai/trend-explanation
 * @desc    Generate explanation for trend data
 * @access  Public
 */
router.post(
  "/trend-explanation",
  aiRateLimiter,
  body("trends").isArray({ min: 1 }).withMessage("Trends array is required"),
  handleValidationErrors,
  aiController.getTrendExplanation
);

/**
 * @route   GET /api/ai/incident-report/:issueId
 * @desc    Generate comprehensive incident report
 * @access  Public
 */
router.get(
  "/incident-report/:issueId",
  aiRateLimiter,
  validateId("issueId"),
  aiController.getIncidentReport
);

export default router;
