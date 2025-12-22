import { getFirestore, COLLECTIONS } from "../../config/firebase";
import { Issue } from "../../types";
import admin from "firebase-admin";

const db = getFirestore();

/**
 * Cast a vote on an issue
 */
export async function voteOnIssue(
  issueId: string,
  userId: string,
  organizationId: string
): Promise<{ success: boolean; message: string; voteCount: number }> {
  try {
    // Check if issue exists
    const issueRef = db.collection(COLLECTIONS.ISSUES).doc(issueId);
    const issueDoc = await issueRef.get();

    if (!issueDoc.exists) {
      return {
        success: false,
        message: "Issue not found",
        voteCount: 0,
      };
    }

    const issue = issueDoc.data() as Issue;

    // Prevent voting on own issues
    if (issue.reportedBy === userId) {
      return {
        success: false,
        message: "You cannot vote on your own issue",
        voteCount: issue.voteCount || 0,
      };
    }

    // Prevent voting on resolved/closed issues (optional - remove if you want to allow)
    if (issue.status === "resolved" || issue.status === "closed") {
      return {
        success: false,
        message: "Cannot vote on resolved or closed issues",
        voteCount: issue.voteCount || 0,
      };
    }

    // Check if user has already voted
    const votedBy = issue.votedBy || [];
    if (votedBy.includes(userId)) {
      return {
        success: false,
        message: "You have already voted on this issue",
        voteCount: issue.voteCount || 0,
      };
    }

    // Use transaction to ensure consistency
    const result = await db.runTransaction(async (transaction) => {
      // Re-read issue in transaction
      const freshIssueDoc = await transaction.get(issueRef);
      if (!freshIssueDoc.exists) {
        throw new Error("Issue not found");
      }

      const freshIssue = freshIssueDoc.data() as Issue;
      const freshVotedBy = freshIssue.votedBy || [];

      // Double-check vote hasn't been added by another transaction
      if (freshVotedBy.includes(userId)) {
        throw new Error("Vote already cast");
      }

      const newVoteCount = (freshIssue.voteCount || 0) + 1;
      const newVotedBy = [...freshVotedBy, userId];

      // Update issue with vote
      transaction.update(issueRef, {
        voteCount: newVoteCount,
        votedBy: newVotedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create vote record
      const voteRef = db.collection(COLLECTIONS.VOTES).doc();
      transaction.set(voteRef, {
        id: voteRef.id,
        issueId,
        userId,
        organizationId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return newVoteCount;
    });

    // Award points to voter (async, don't wait)
    awardVotingPoints(userId, issueId, organizationId, "vote_cast").catch(
      (err) => console.error("Error awarding vote points:", err)
    );

    // Award points to issue reporter (async, don't wait)
    awardVotingPoints(
      issue.reportedBy,
      issueId,
      organizationId,
      "vote_received"
    ).catch((err) => console.error("Error awarding reporter points:", err));

    return {
      success: true,
      message: "Vote cast successfully",
      voteCount: result,
    };
  } catch (error: any) {
    console.error("Error voting on issue:", error);
    return {
      success: false,
      message: error.message || "Failed to cast vote",
      voteCount: 0,
    };
  }
}

/**
 * Remove a vote from an issue
 */
export async function unvoteOnIssue(
  issueId: string,
  userId: string
): Promise<{ success: boolean; message: string; voteCount: number }> {
  try {
    // Check if issue exists
    const issueRef = db.collection(COLLECTIONS.ISSUES).doc(issueId);
    const issueDoc = await issueRef.get();

    if (!issueDoc.exists) {
      return {
        success: false,
        message: "Issue not found",
        voteCount: 0,
      };
    }

    const issue = issueDoc.data() as Issue;

    // Check if user has voted
    const votedBy = issue.votedBy || [];
    if (!votedBy.includes(userId)) {
      return {
        success: false,
        message: "You have not voted on this issue",
        voteCount: issue.voteCount || 0,
      };
    }

    // Use transaction to ensure consistency
    const result = await db.runTransaction(async (transaction) => {
      // Re-read issue in transaction
      const freshIssueDoc = await transaction.get(issueRef);
      if (!freshIssueDoc.exists) {
        throw new Error("Issue not found");
      }

      const freshIssue = freshIssueDoc.data() as Issue;
      const freshVotedBy = freshIssue.votedBy || [];

      // Double-check vote exists
      if (!freshVotedBy.includes(userId)) {
        throw new Error("Vote not found");
      }

      const newVoteCount = Math.max(0, (freshIssue.voteCount || 0) - 1);
      const newVotedBy = freshVotedBy.filter((id) => id !== userId);

      // Update issue
      transaction.update(issueRef, {
        voteCount: newVoteCount,
        votedBy: newVotedBy,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Delete vote record
      const voteQuery = await db
        .collection(COLLECTIONS.VOTES)
        .where("issueId", "==", issueId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (!voteQuery.empty) {
        transaction.delete(voteQuery.docs[0].ref);
      }

      return newVoteCount;
    });

    return {
      success: true,
      message: "Vote removed successfully",
      voteCount: result,
    };
  } catch (error: any) {
    console.error("Error unvoting on issue:", error);
    return {
      success: false,
      message: error.message || "Failed to remove vote",
      voteCount: 0,
    };
  }
}

/**
 * Get votes for an issue
 */
export async function getIssueVotes(issueId: string): Promise<{
  voteCount: number;
  voters: Array<{ userId: string; votedAt: admin.firestore.Timestamp }>;
}> {
  try {
    const votesSnapshot = await db
      .collection(COLLECTIONS.VOTES)
      .where("issueId", "==", issueId)
      .orderBy("createdAt", "desc")
      .get();

    const voters = votesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        userId: data.userId,
        votedAt: data.createdAt,
      };
    });

    return {
      voteCount: voters.length,
      voters,
    };
  } catch (error) {
    console.error("Error getting issue votes:", error);
    return {
      voteCount: 0,
      voters: [],
    };
  }
}

/**
 * Get user's votes
 */
export async function getUserVotes(userId: string): Promise<string[]> {
  try {
    const votesSnapshot = await db
      .collection(COLLECTIONS.VOTES)
      .where("userId", "==", userId)
      .get();

    return votesSnapshot.docs.map((doc) => doc.data().issueId);
  } catch (error) {
    console.error("Error getting user votes:", error);
    return [];
  }
}

/**
 * Check if user has voted on an issue
 */
export async function hasUserVoted(
  issueId: string,
  userId: string
): Promise<boolean> {
  try {
    const voteQuery = await db
      .collection(COLLECTIONS.VOTES)
      .where("issueId", "==", issueId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    return !voteQuery.empty;
  } catch (error) {
    console.error("Error checking vote:", error);
    return false;
  }
}

/**
 * Award points for voting actions
 */
async function awardVotingPoints(
  userId: string,
  issueId: string,
  organizationId: string,
  type: "vote_cast" | "vote_received"
): Promise<void> {
  const points = type === "vote_cast" ? 2 : 5;

  try {
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const currentPoints = userData?.rewardPoints || 0;
      const currentStats = userData?.statistics || {};

      // Update points and statistics
      transaction.update(userRef, {
        rewardPoints: currentPoints + points,
        level: calculateLevel(currentPoints + points),
        "statistics.votesReceived":
          type === "vote_received"
            ? (currentStats.votesReceived || 0) + 1
            : currentStats.votesReceived || 0,
        "statistics.votesCast":
          type === "vote_cast"
            ? (currentStats.votesCast || 0) + 1
            : currentStats.votesCast || 0,
      });

      // Create transaction record
      const transactionRef = db
        .collection(COLLECTIONS.REWARD_TRANSACTIONS)
        .doc();
      transaction.set(transactionRef, {
        id: transactionRef.id,
        userId,
        organizationId,
        type,
        points,
        relatedEntityId: issueId,
        relatedEntityType: "issue",
        description:
          type === "vote_cast"
            ? "Voted on an issue"
            : "Received a vote on your issue",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Check for badge eligibility (don't wait)
    checkAndAwardBadges(userId, organizationId).catch((err) =>
      console.error("Error checking badges:", err)
    );
  } catch (error) {
    console.error("Error awarding voting points:", error);
    throw error;
  }
}

/**
 * Calculate user level based on points
 */
function calculateLevel(points: number): number {
  if (points >= 12000) return 10;
  if (points >= 8000) return 9;
  if (points >= 5500) return 8;
  if (points >= 3500) return 7;
  if (points >= 2000) return 6;
  if (points >= 1000) return 5;
  if (points >= 500) return 4;
  if (points >= 250) return 3;
  if (points >= 100) return 2;
  return 1;
}

/**
 * Check and award badges to user (placeholder - full implementation in rewards service)
 */
async function checkAndAwardBadges(
  _userId: string,
  _organizationId: string
): Promise<void> {
  // This will be fully implemented in rewards.service.ts
  // For now, just a placeholder
}
