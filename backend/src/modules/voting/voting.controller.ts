import { Request, Response } from "express";
import * as votingService from "./voting.service";

/**
 * Cast a vote on an issue
 * POST /api/issues/:id/vote
 */
export async function voteOnIssue(req: Request, res: Response) {
  try {
    const { id: issueId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    // Get user's organization from request or user document
    const organizationId =
      req.user?.organizationId || req.body.organizationId || "unknown";

    const result = await votingService.voteOnIssue(
      issueId,
      userId,
      organizationId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Vote failed",
        message: result.message,
        data: { voteCount: result.voteCount },
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        voteCount: result.voteCount,
        voted: true,
      },
    });
  } catch (error: any) {
    console.error("Error in voteOnIssue controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to cast vote",
    });
  }
}

/**
 * Remove a vote from an issue
 * DELETE /api/issues/:id/vote
 */
export async function unvoteOnIssue(req: Request, res: Response) {
  try {
    const { id: issueId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const result = await votingService.unvoteOnIssue(issueId, userId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: "Unvote failed",
        message: result.message,
        data: { voteCount: result.voteCount },
      });
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        voteCount: result.voteCount,
        voted: false,
      },
    });
  } catch (error: any) {
    console.error("Error in unvoteOnIssue controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to remove vote",
    });
  }
}

/**
 * Get votes for an issue
 * GET /api/issues/:id/votes
 */
export async function getIssueVotes(req: Request, res: Response) {
  try {
    const { id: issueId } = req.params;
    const userId = req.user?.uid;

    const votes = await votingService.getIssueVotes(issueId);

    // Check if current user has voted
    let hasVoted = false;
    if (userId) {
      hasVoted = await votingService.hasUserVoted(issueId, userId);
    }

    res.status(200).json({
      success: true,
      data: {
        voteCount: votes.voteCount,
        voters: votes.voters,
        hasVoted,
      },
    });
  } catch (error: any) {
    console.error("Error in getIssueVotes controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get votes",
    });
  }
}

/**
 * Get user's voted issues
 * GET /api/users/me/votes
 */
export async function getUserVotes(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const votedIssueIds = await votingService.getUserVotes(userId);

    res.status(200).json({
      success: true,
      data: {
        votedIssueIds,
        count: votedIssueIds.length,
      },
    });
  } catch (error: any) {
    console.error("Error in getUserVotes controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to get user votes",
    });
  }
}

/**
 * Check if user has voted on an issue
 * GET /api/issues/:id/vote/check
 */
export async function checkUserVote(req: Request, res: Response) {
  try {
    const { id: issueId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(200).json({
        success: true,
        data: { hasVoted: false },
      });
    }

    const hasVoted = await votingService.hasUserVoted(issueId, userId);

    res.status(200).json({
      success: true,
      data: { hasVoted },
    });
  } catch (error: any) {
    console.error("Error in checkUserVote controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message || "Failed to check vote",
    });
  }
}
