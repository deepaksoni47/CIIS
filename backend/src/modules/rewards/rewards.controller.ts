import { Request, Response } from "express";
import * as rewardsService from "./rewards.service";
import admin from "firebase-admin";

/**
 * Get user's reward profile
 * GET /api/users/:id/rewards
 */
export async function getUserRewards(req: Request, res: Response) {
  try {
    const { id: userId } = req.params;
    const requesterId = req.user?.uid;

    // Users can only view their own rewards unless admin
    if (userId !== requesterId && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You can only view your own rewards",
      });
    }

    const rewards = await rewardsService.getUserRewards(userId);

    res.status(200).json({
      success: true,
      data: rewards,
    });
  } catch (error: any) {
    console.error("Error in getUserRewards controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get user rewards",
    });
  }
}

/**
 * Get current user's reward profile
 * GET /api/users/me/rewards
 */
export async function getMyRewards(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const rewards = await rewardsService.getUserRewards(userId);

    res.status(200).json({
      success: true,
      data: rewards,
    });
  } catch (error: any) {
    console.error("Error in getMyRewards controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get rewards",
    });
  }
}

/**
 * Get user's transaction history
 * GET /api/users/:id/transactions
 */
export async function getUserTransactions(req: Request, res: Response) {
  try {
    const { id: userId } = req.params;
    const requesterId = req.user?.uid;
    const limit = parseInt(req.query.limit as string) || 50;

    // Users can only view their own transactions unless admin
    if (userId !== requesterId && req.user?.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Forbidden",
        message: "You can only view your own transactions",
      });
    }

    const transactions = await rewardsService.getUserTransactions(
      userId,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        transactions,
        count: transactions.length,
      },
    });
  } catch (error: any) {
    console.error("Error in getUserTransactions controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get transactions",
    });
  }
}

/**
 * Get all available badges
 * GET /api/badges
 */
export async function getAllBadges(_req: Request, res: Response) {
  try {
    const badges = await rewardsService.getAllBadges();

    res.status(200).json({
      success: true,
      data: {
        badges,
        count: badges.length,
      },
    });
  } catch (error: any) {
    console.error("Error in getAllBadges controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get badges",
    });
  }
}

/**
 * Get badge details
 * GET /api/badges/:id
 */
export async function getBadge(req: Request, res: Response) {
  try {
    const { id: badgeId } = req.params;
    const includeAchievers = req.query.includeAchievers === "true";

    const badge = await rewardsService.getBadgeById(badgeId);

    if (!badge) {
      return res.status(404).json({
        success: false,
        error: "Not found",
        message: "Badge not found",
      });
    }

    let achievers: Array<{
      userId: string;
      userName: string;
      earnedAt: admin.firestore.Timestamp;
    }> = [];
    if (includeAchievers) {
      achievers = await rewardsService.getBadgeAchievers(badgeId, 20);
    }

    res.status(200).json({
      success: true,
      data: {
        badge,
        achievers: includeAchievers ? achievers : undefined,
        achieverCount: achievers.length,
      },
    });
  } catch (error: any) {
    console.error("Error in getBadge controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get badge",
    });
  }
}

/**
 * Get leaderboard
 * GET /api/leaderboard
 */
export async function getLeaderboard(req: Request, res: Response) {
  try {
    const organizationId = req.query.organizationId as string;
    const period =
      (req.query.period as "all_time" | "monthly" | "weekly") || "all_time";
    const limit = parseInt(req.query.limit as string) || 100;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: "Bad request",
        message: "organizationId is required",
      });
    }

    const leaderboard = await rewardsService.getLeaderboard(
      organizationId,
      period,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        leaderboard,
        period,
        count: leaderboard.length,
      },
    });
  } catch (error: any) {
    console.error("Error in getLeaderboard controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get leaderboard",
    });
  }
}

/**
 * Award points to user (admin only)
 * POST /api/admin/users/:id/award-points
 */
export async function awardPoints(req: Request, res: Response) {
  try {
    const { id: userId } = req.params;
    const { points, description } = req.body;

    if (!points || !description) {
      return res.status(400).json({
        success: false,
        error: "Bad request",
        message: "points and description are required",
      });
    }

    const organizationId = req.user?.organizationId || "unknown";

    await rewardsService.awardPoints(
      userId,
      organizationId,
      points,
      "admin_bonus",
      description
    );

    res.status(200).json({
      success: true,
      message: `Awarded ${points} points to user`,
    });
  } catch (error: any) {
    console.error("Error in awardPoints controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to award points",
    });
  }
}

/**
 * Manually check and award badges (admin only)
 * POST /api/admin/users/:id/check-badges
 */
export async function checkBadges(req: Request, res: Response) {
  try {
    const { id: userId } = req.params;
    const organizationId = req.user?.organizationId || "unknown";

    const newBadges = await rewardsService.checkAndAwardBadges(
      userId,
      organizationId
    );

    res.status(200).json({
      success: true,
      message: `Checked badges for user`,
      data: {
        newBadges,
        count: newBadges.length,
      },
    });
  } catch (error: any) {
    console.error("Error in checkBadges controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to check badges",
    });
  }
}
