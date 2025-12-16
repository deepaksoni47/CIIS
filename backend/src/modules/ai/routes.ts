import { Router } from "express";
import * as aiController from "./ai.controller";

const router = Router();

/**
 * @route   GET /api/ai/insights
 * @desc    Generate general AI insights from recent issues
 * @access  Public
 */
router.get("/insights", aiController.generateGeneralInsights);

/**
 * @route   GET /api/ai/risk/:buildingId
 * @desc    Generate risk assessment for a specific building
 * @access  Public
 */
router.get("/risk/:buildingId", aiController.generateBuildingRisk);

/**
 * @route   GET /api/ai/summary/:issueId
 * @desc    Generate AI summary for a specific issue
 * @access  Public
 */
router.get("/summary/:issueId", aiController.generateIssueSummary);

/**
 * @route   GET /api/ai/suggestions
 * @desc    Get maintenance suggestions (query params: category, severity)
 * @access  Public
 */
router.get("/suggestions", aiController.getMaintenanceSuggestions);

/**
 * @route   POST /api/ai/chat
 * @desc    Chat with AI assistant
 * @access  Public
 */
router.post("/chat", aiController.chatWithAI);

export default router;
