import { Router } from "express";
import { authenticateUser } from "../../middlewares/auth";
import * as votingController from "./voting.controller";

const router = Router();

/**
 * @route   POST /api/issues/:id/vote
 * @desc    Cast a vote on an issue
 * @access  Private (authenticated users)
 */
router.post("/:id/vote", authenticateUser, votingController.voteOnIssue);

/**
 * @route   DELETE /api/issues/:id/vote
 * @desc    Remove a vote from an issue
 * @access  Private (authenticated users)
 */
router.delete("/:id/vote", authenticateUser, votingController.unvoteOnIssue);

/**
 * @route   GET /api/issues/:id/votes
 * @desc    Get votes for an issue
 * @access  Public (authenticated)
 */
router.get("/:id/votes", authenticateUser, votingController.getIssueVotes);

/**
 * @route   GET /api/issues/:id/vote/check
 * @desc    Check if user has voted on an issue
 * @access  Public (authenticated)
 */
router.get("/:id/vote/check", authenticateUser, votingController.checkUserVote);

export default router;
