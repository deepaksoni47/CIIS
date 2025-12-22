import { getFirestore, COLLECTIONS } from "../../config/firebase";
import { User, Badge, RewardTransaction, LeaderboardEntry } from "../../types";
import admin from "firebase-admin";

const db = getFirestore();

/**
 * Get user's reward profile
 */
export async function getUserRewards(userId: string): Promise<{
  rewardPoints: number;
  level: number;
  badges: Badge[];
  statistics: User["statistics"];
  nextLevelPoints: number;
  levelProgress: number;
}> {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();

    if (!userDoc.exists) {
      throw new Error("User not found");
    }

    const userData = userDoc.data() as User;
    const points = userData.rewardPoints || 0;
    const level = userData.level || 1;
    const badgeIds = userData.badges || [];

    // Get badge details
    const badges: Badge[] = [];
    if (badgeIds.length > 0) {
      const badgesSnapshot = await db
        .collection(COLLECTIONS.BADGES)
        .where(
          admin.firestore.FieldPath.documentId(),
          "in",
          badgeIds.slice(0, 10)
        )
        .get();

      badgesSnapshot.docs.forEach((doc) => {
        badges.push({ id: doc.id, ...doc.data() } as Badge);
      });
    }

    // Calculate next level
    const nextLevelPoints = getPointsForLevel(level + 1);
    const currentLevelPoints = getPointsForLevel(level);
    const levelProgress =
      ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) *
      100;

    return {
      rewardPoints: points,
      level,
      badges,
      statistics: userData.statistics || {},
      nextLevelPoints,
      levelProgress: Math.min(100, Math.max(0, levelProgress)),
    };
  } catch (error) {
    console.error("Error getting user rewards:", error);
    throw error;
  }
}

/**
 * Get user's transaction history
 */
export async function getUserTransactions(
  userId: string,
  limit: number = 50
): Promise<RewardTransaction[]> {
  try {
    const transactionsSnapshot = await db
      .collection(COLLECTIONS.REWARD_TRANSACTIONS)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return transactionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as RewardTransaction[];
  } catch (error) {
    console.error("Error getting user transactions:", error);
    return [];
  }
}

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  try {
    // Simplified query to avoid composite index requirement
    const badgesSnapshot = await db
      .collection(COLLECTIONS.BADGES)
      .where("isActive", "==", true)
      .get();

    // Sort in memory instead of using Firestore orderBy
    const badges = badgesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Badge[];

    // Define rarity order for sorting
    const rarityOrder: Record<string, number> = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4,
    };

    // Sort by rarity, then by threshold
    badges.sort((a, b) => {
      const rarityDiff = rarityOrder[a.rarity] - rarityOrder[b.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      return a.criteria.threshold - b.criteria.threshold;
    });

    return badges;
  } catch (error) {
    console.error("Error getting badges:", error);
    return [];
  }
}

/**
 * Get badge details
 */
export async function getBadgeById(badgeId: string): Promise<Badge | null> {
  try {
    const badgeDoc = await db.collection(COLLECTIONS.BADGES).doc(badgeId).get();

    if (!badgeDoc.exists) {
      return null;
    }

    return { id: badgeDoc.id, ...badgeDoc.data() } as Badge;
  } catch (error) {
    console.error("Error getting badge:", error);
    return null;
  }
}

/**
 * Get users who earned a specific badge
 */
export async function getBadgeAchievers(
  badgeId: string,
  limit: number = 20
): Promise<
  Array<{
    userId: string;
    userName: string;
    earnedAt: admin.firestore.Timestamp;
  }>
> {
  try {
    const userBadgesSnapshot = await db
      .collection(COLLECTIONS.USER_BADGES)
      .where("badgeId", "==", badgeId)
      .orderBy("earnedAt", "desc")
      .limit(limit)
      .get();

    const achievers = await Promise.all(
      userBadgesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const userDoc = await db
          .collection(COLLECTIONS.USERS)
          .doc(data.userId)
          .get();
        const userData = userDoc.data();

        return {
          userId: data.userId,
          userName: userData?.name || "Unknown User",
          earnedAt: data.earnedAt,
        };
      })
    );

    return achievers;
  } catch (error) {
    console.error("Error getting badge achievers:", error);
    return [];
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  organizationId: string,
  period: "all_time" | "monthly" | "weekly" = "all_time",
  limit: number = 100
): Promise<LeaderboardEntry[]> {
  try {
    // Try to get cached leaderboard
    const leaderboardSnapshot = await db
      .collection(COLLECTIONS.LEADERBOARD)
      .where("organizationId", "==", organizationId)
      .where("period", "==", period)
      .orderBy("rank")
      .limit(limit)
      .get();

    if (!leaderboardSnapshot.empty) {
      return leaderboardSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeaderboardEntry[];
    }

    // If no cached leaderboard, generate it
    return await generateLeaderboard(organizationId, period, limit);
  } catch (error) {
    console.error("Error getting leaderboard:", error);
    // Fallback to live calculation
    return await generateLeaderboard(organizationId, period, limit);
  }
}

/**
 * Generate leaderboard from user data
 */
async function generateLeaderboard(
  organizationId: string,
  period: "all_time" | "monthly" | "weekly",
  limit: number
): Promise<LeaderboardEntry[]> {
  try {
    console.log(
      `Generating leaderboard for org: ${organizationId}, period: ${period}`
    );

    // Get all users in the organization
    const usersSnapshot = await db
      .collection(COLLECTIONS.USERS)
      .where("organizationId", "==", organizationId)
      .get();

    console.log(`Found ${usersSnapshot.size} users in organization`);
    if (usersSnapshot.empty) {
      console.log(`No users found for organization: ${organizationId}`);
    }

    // Filter out inactive users and sort by reward points
    const users = usersSnapshot.docs
      .map((doc) => {
        const userData = doc.data() as User;
        return {
          ...userData,
          id: doc.id,
        };
      })
      .filter((user) => user.isActive !== false) // Include users where isActive is undefined or true
      .sort((a, b) => (b.rewardPoints || 0) - (a.rewardPoints || 0))
      .slice(0, limit);

    console.log(
      `After filtering: ${users.length} active users with top points: ${users
        .slice(0, 3)
        .map((u) => u.rewardPoints || 0)
        .join(", ")}`
    );
    if (users.length === 0) {
      console.log("No active users found after filtering");
    }

    const leaderboard: LeaderboardEntry[] = users.map((userData, index) => {
      return {
        id: `${period}_${userData.id}`,
        userId: userData.id,
        organizationId,
        userName: userData.name || userData.email || "Unknown User",
        userRole: userData.role || "student",
        rewardPoints: userData.rewardPoints || 0,
        level: userData.level || 1,
        rank: index + 1,
        issuesReported: userData.statistics?.issuesReported || 0,
        votesReceived: userData.statistics?.votesReceived || 0,
        badges: userData.badges || [],
        period,
        updatedAt: admin.firestore.Timestamp.now(),
      };
    });

    console.log(`Generated leaderboard with ${leaderboard.length} entries`);
    return leaderboard;
  } catch (error) {
    console.error("Error generating leaderboard:", error);
    return [];
  }
}

/**
 * Award points to user
 */
export async function awardPoints(
  userId: string,
  organizationId: string,
  points: number,
  type: string,
  description: string,
  relatedEntityId?: string,
  relatedEntityType?: string
): Promise<void> {
  try {
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const currentPoints = userData?.rewardPoints || 0;
      const newPoints = currentPoints + points;

      // Update user
      transaction.update(userRef, {
        rewardPoints: newPoints,
        level: calculateLevel(newPoints),
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
        relatedEntityId,
        relatedEntityType,
        description,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Check for new badges
    await checkAndAwardBadges(userId, organizationId);
  } catch (error) {
    console.error("Error awarding points:", error);
    throw error;
  }
}

/**
 * Check and award badges to user
 */
export async function checkAndAwardBadges(
  userId: string,
  organizationId: string
): Promise<Badge[]> {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!userDoc.exists) return [];

    const userData = userDoc.data() as User;
    const stats = userData.statistics || {};
    const currentPoints = userData.rewardPoints || 0;
    const currentBadges = userData.badges || [];

    // Get all active badges
    const badgesSnapshot = await db
      .collection(COLLECTIONS.BADGES)
      .where("isActive", "==", true)
      .get();

    const newlyEarnedBadges: Badge[] = [];

    for (const badgeDoc of badgesSnapshot.docs) {
      const badge = { id: badgeDoc.id, ...badgeDoc.data() } as Badge;

      // Skip if user already has this badge
      if (currentBadges.includes(badge.id)) continue;

      // Check if user meets criteria
      let meetscriteriaeria = false;
      const { type, threshold } = badge.criteria;

      switch (type) {
        case "issues_reported":
          meetscriteriaeria = (stats.issuesReported || 0) >= threshold;
          break;
        case "votes_received":
          meetscriteriaeria = (stats.votesReceived || 0) >= threshold;
          break;
        case "votes_cast":
          meetscriteriaeria = (stats.votesCast || 0) >= threshold;
          break;
        case "issues_resolved":
          meetscriteriaeria = (stats.issuesResolved || 0) >= threshold;
          break;
        case "helpful_reports":
          meetscriteriaeria = (stats.helpfulReports || 0) >= threshold;
          break;
        case "points_earned":
          meetscriteriaeria = currentPoints >= threshold;
          break;
        default:
          meetscriteriaeria = false;
      }

      if (meetscriteriaeria) {
        // Award badge
        await awardBadge(userId, organizationId, badge);
        newlyEarnedBadges.push(badge);
      }
    }

    return newlyEarnedBadges;
  } catch (error) {
    console.error("Error checking badges:", error);
    return [];
  }
}

/**
 * Award a badge to user
 */
async function awardBadge(
  userId: string,
  organizationId: string,
  badge: Badge
): Promise<void> {
  try {
    await db.runTransaction(async (transaction) => {
      const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const currentPoints = userData?.rewardPoints || 0;

      // Add badge to user
      transaction.update(userRef, {
        badges: admin.firestore.FieldValue.arrayUnion(badge.id),
        rewardPoints: currentPoints + badge.pointsAwarded,
        level: calculateLevel(currentPoints + badge.pointsAwarded),
      });

      // Create user_badge record
      const userBadgeRef = db.collection(COLLECTIONS.USER_BADGES).doc();
      transaction.set(userBadgeRef, {
        id: userBadgeRef.id,
        userId,
        badgeId: badge.id,
        organizationId,
        earnedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create transaction for badge points
      const transactionRef = db
        .collection(COLLECTIONS.REWARD_TRANSACTIONS)
        .doc();
      transaction.set(transactionRef, {
        id: transactionRef.id,
        userId,
        organizationId,
        type: "badge_earned",
        points: badge.pointsAwarded,
        relatedEntityId: badge.id,
        relatedEntityType: "badge",
        description: `Earned badge: ${badge.name}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (error) {
    console.error("Error awarding badge:", error);
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
 * Get points required for a level
 */
function getPointsForLevel(level: number): number {
  const levels = [
    0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 999999,
  ];
  return levels[Math.min(level, levels.length - 1)] || 0;
}

/**
 * Update user statistics
 */
export async function updateUserStatistics(
  userId: string,
  field: keyof User["statistics"],
  increment: number = 1
): Promise<void> {
  try {
    const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
    await userRef.update({
      [`statistics.${field}`]: admin.firestore.FieldValue.increment(increment),
    });
  } catch (error) {
    console.error("Error updating user statistics:", error);
  }
}
