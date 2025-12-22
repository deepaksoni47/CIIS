import { Router } from "express";
import { authenticateUser, requireAdmin } from "../../middlewares/auth";
import * as rewardsController from "./rewards.controller";

const router = Router();

/**
 * @route   GET /api/users/me/rewards
 * @desc    Get current user's reward profile
 * @access  Private
 */
router.get(
  "/users/me/rewards",
  authenticateUser,
  rewardsController.getMyRewards
);

/**
 * @route   GET /api/users/:id/rewards
 * @desc    Get user's reward profile
 * @access  Private (own profile or admin)
 */
router.get(
  "/users/:id/rewards",
  authenticateUser,
  rewardsController.getUserRewards
);

/**
 * @route   GET /api/users/:id/transactions
 * @desc    Get user's transaction history
 * @access  Private (own profile or admin)
 */
router.get(
  "/users/:id/transactions",
  authenticateUser,
  rewardsController.getUserTransactions
);

/**
 * @route   GET /api/badges
 * @desc    Get all available badges
 * @access  Private
 */
router.get("/badges", authenticateUser, rewardsController.getAllBadges);

/**
 * @route   GET /api/badges/:id
 * @desc    Get badge details
 * @access  Private
 */
router.get("/badges/:id", authenticateUser, rewardsController.getBadge);

/**
 * @route   GET /api/leaderboard
 * @desc    Get leaderboard
 * @access  Private
 */
router.get("/leaderboard", authenticateUser, rewardsController.getLeaderboard);

/**
 * @route   POST /api/admin/users/:id/award-points
 * @desc    Award points to user (admin only)
 * @access  Admin
 */
router.post(
  "/admin/users/:id/award-points",
  authenticateUser,
  requireAdmin,
  rewardsController.awardPoints
);

/**
 * @route   POST /api/admin/users/:id/check-badges
 * @desc    Manually check and award badges (admin only)
 * @access  Admin
 */
router.post(
  "/admin/users/:id/check-badges",
  authenticateUser,
  requireAdmin,
  rewardsController.checkBadges
);

export default router;
