import "../env";
import { getFirestore, COLLECTIONS } from "../config/firebase";
import admin from "firebase-admin";

const db = getFirestore();

/**
 * Migration script to add voting and rewards fields to existing data
 */
async function migrateDatabase() {
  console.log(
    "🔄 Starting database migration for Voting & Rewards system...\n"
  );

  try {
    // Step 1: Update existing issues
    console.log("1️⃣ Updating Issues collection...");
    const issuesSnapshot = await db.collection(COLLECTIONS.ISSUES).get();
    const issuesBatch = db.batch();
    let issuesUpdated = 0;

    issuesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Only update if fields don't exist
      if (data.voteCount === undefined || data.votedBy === undefined) {
        issuesBatch.update(doc.ref, {
          voteCount: 0,
          votedBy: [],
        });
        issuesUpdated++;
      }
    });

    if (issuesUpdated > 0) {
      await issuesBatch.commit();
      console.log(`   ✅ Updated ${issuesUpdated} issues with voting fields\n`);
    } else {
      console.log(`   ℹ️  All issues already have voting fields\n`);
    }

    // Step 2: Update existing users
    console.log("2️⃣ Updating Users collection...");
    const usersSnapshot = await db.collection(COLLECTIONS.USERS).get();
    const usersBatch = db.batch();
    let usersUpdated = 0;

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();

      // Only update if rewards fields don't exist
      if (data.rewardPoints === undefined) {
        // Calculate existing statistics
        const userId = doc.id;

        // Count issues reported
        const reportedIssues = await db
          .collection(COLLECTIONS.ISSUES)
          .where("reportedBy", "==", userId)
          .get();

        const issuesReported = reportedIssues.size;

        // Count issues resolved (for facility managers/admins)
        const resolvedIssues = await db
          .collection(COLLECTIONS.ISSUES)
          .where("assignedTo", "==", userId)
          .where("status", "==", "resolved")
          .get();

        const issuesResolved = resolvedIssues.size;

        // Initialize rewards fields
        usersBatch.update(doc.ref, {
          rewardPoints: 0,
          level: 1,
          badges: [],
          statistics: {
            issuesReported,
            issuesResolved,
            votesReceived: 0, // Will be calculated after votes are added
            votesCast: 0,
            helpfulReports: 0,
          },
        });

        usersUpdated++;
      }
    }

    if (usersUpdated > 0) {
      await usersBatch.commit();
      console.log(`   ✅ Updated ${usersUpdated} users with rewards fields\n`);
    } else {
      console.log(`   ℹ️  All users already have rewards fields\n`);
    }

    // Step 3: Backfill initial points for existing issues
    console.log("3️⃣ Backfilling reward points for existing activity...");
    const POINTS_PER_ISSUE = 10;
    let pointsAwarded = 0;

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const userId = doc.id;

      if (data.statistics && data.statistics.issuesReported > 0) {
        const basePoints = data.statistics.issuesReported * POINTS_PER_ISSUE;
        const resolverBonus = (data.statistics.issuesResolved || 0) * 50; // 50 points per resolution

        const totalPoints = basePoints + resolverBonus;

        if (totalPoints > 0) {
          // Update user points
          await doc.ref.update({
            rewardPoints: admin.firestore.FieldValue.increment(totalPoints),
            level: calculateLevel(totalPoints),
          });

          // Create transaction record
          await db.collection(COLLECTIONS.REWARD_TRANSACTIONS).add({
            userId,
            organizationId: data.organizationId || "unknown",
            type: "admin_bonus",
            points: totalPoints,
            description: `Backfilled points for ${data.statistics.issuesReported} existing issues`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          pointsAwarded += totalPoints;
        }
      }
    }

    console.log(
      `   ✅ Awarded ${pointsAwarded} total points for existing activity\n`
    );

    // Step 4: Create indexes reminder
    console.log("4️⃣ Database indexes...");
    console.log(
      `   ⚠️  Remember to create composite indexes in Firebase Console:`
    );
    console.log(`   - votes: issueId + userId (for duplicate prevention)`);
    console.log(`   - user_badges: userId + badgeId (unique constraint)`);
    console.log(`   - reward_transactions: userId + createdAt (desc)`);
    console.log(`   - leaderboard: organizationId + period + rank`);

    console.log("\n✅ Migration completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Issues updated: ${issuesUpdated}`);
    console.log(`   - Users updated: ${usersUpdated}`);
    console.log(`   - Points backfilled: ${pointsAwarded}`);

    console.log("\n🎯 Next Steps:");
    console.log("   1. Run: npm run seed:badges");
    console.log("   2. Create Firestore indexes");
    console.log("   3. Update Firestore security rules");
    console.log("   4. Deploy backend API changes");
    console.log("   5. Update frontend components");

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
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

migrateDatabase();
