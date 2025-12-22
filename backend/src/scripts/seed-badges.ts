import "../env";
import { getFirestore, COLLECTIONS } from "../config/firebase";
import admin from "firebase-admin";

const db = getFirestore();

/**
 * Seed initial badge definitions
 */
async function seedBadges() {
  console.log("🏆 Seeding initial badges...\n");

  const badges = [
    // REPORTER BADGES
    {
      id: "first_reporter",
      name: "First Reporter",
      description: "Report your first infrastructure issue",
      icon: "🎯",
      category: "reporter",
      criteria: {
        type: "issues_reported",
        threshold: 1,
        description: "Report 1 issue",
      },
      pointsAwarded: 10,
      rarity: "common",
      isActive: true,
    },
    {
      id: "active_reporter",
      name: "Active Reporter",
      description: "Report 10 infrastructure issues",
      icon: "📝",
      category: "reporter",
      criteria: {
        type: "issues_reported",
        threshold: 10,
        description: "Report 10 issues",
      },
      pointsAwarded: 50,
      rarity: "common",
      isActive: true,
    },
    {
      id: "issue_hunter",
      name: "Issue Hunter",
      description: "Report 50 infrastructure issues",
      icon: "🔍",
      category: "reporter",
      criteria: {
        type: "issues_reported",
        threshold: 50,
        description: "Report 50 issues",
      },
      pointsAwarded: 200,
      rarity: "rare",
      isActive: true,
    },
    {
      id: "infrastructure_guardian",
      name: "Infrastructure Guardian",
      description: "Report 100 infrastructure issues",
      icon: "🛡️",
      category: "reporter",
      criteria: {
        type: "issues_reported",
        threshold: 100,
        description: "Report 100 issues",
      },
      pointsAwarded: 500,
      rarity: "epic",
      isActive: true,
    },
    {
      id: "campus_legend",
      name: "Campus Legend",
      description: "Report 250 infrastructure issues",
      icon: "👑",
      category: "reporter",
      criteria: {
        type: "issues_reported",
        threshold: 250,
        description: "Report 250 issues",
      },
      pointsAwarded: 1000,
      rarity: "legendary",
      isActive: true,
    },

    // VOTER BADGES
    {
      id: "first_vote",
      name: "First Vote",
      description: "Cast your first vote on an issue",
      icon: "🗳️",
      category: "voter",
      criteria: {
        type: "votes_cast",
        threshold: 1,
        description: "Vote on 1 issue",
      },
      pointsAwarded: 5,
      rarity: "common",
      isActive: true,
    },
    {
      id: "engaged_citizen",
      name: "Engaged Citizen",
      description: "Cast 25 votes to help prioritize issues",
      icon: "🎖️",
      category: "voter",
      criteria: {
        type: "votes_cast",
        threshold: 25,
        description: "Vote on 25 issues",
      },
      pointsAwarded: 75,
      rarity: "common",
      isActive: true,
    },
    {
      id: "community_voice",
      name: "Community Voice",
      description: "Cast 100 votes to help prioritize issues",
      icon: "📢",
      category: "voter",
      criteria: {
        type: "votes_cast",
        threshold: 100,
        description: "Vote on 100 issues",
      },
      pointsAwarded: 150,
      rarity: "rare",
      isActive: true,
    },
    {
      id: "democracy_champion",
      name: "Democracy Champion",
      description: "Cast 500 votes to shape campus priorities",
      icon: "🏛️",
      category: "voter",
      criteria: {
        type: "votes_cast",
        threshold: 500,
        description: "Vote on 500 issues",
      },
      pointsAwarded: 400,
      rarity: "epic",
      isActive: true,
    },

    // POPULAR REPORTER BADGES
    {
      id: "heard",
      name: "Heard",
      description: "Receive 5 votes on your reported issues",
      icon: "👂",
      category: "reporter",
      criteria: {
        type: "votes_received",
        threshold: 5,
        description: "Get 5 votes total",
      },
      pointsAwarded: 25,
      rarity: "common",
      isActive: true,
    },
    {
      id: "crowd_favorite",
      name: "Crowd Favorite",
      description: "Receive 50 votes on your reported issues",
      icon: "⭐",
      category: "reporter",
      criteria: {
        type: "votes_received",
        threshold: 50,
        description: "Get 50 votes total",
      },
      pointsAwarded: 250,
      rarity: "epic",
      isActive: true,
    },
    {
      id: "viral_reporter",
      name: "Viral Reporter",
      description: "Receive 200 votes on your reported issues",
      icon: "🔥",
      category: "reporter",
      criteria: {
        type: "votes_received",
        threshold: 200,
        description: "Get 200 votes total",
      },
      pointsAwarded: 750,
      rarity: "legendary",
      isActive: true,
    },

    // HELPFUL REPORTER BADGES
    {
      id: "quick_reporter",
      name: "Quick Reporter",
      description: "Have 5 issues resolved within 24 hours",
      icon: "⚡",
      category: "reporter",
      criteria: {
        type: "helpful_reports",
        threshold: 5,
        description: "5 issues resolved quickly",
      },
      pointsAwarded: 100,
      rarity: "rare",
      isActive: true,
    },
    {
      id: "impact_maker",
      name: "Impact Maker",
      description: "Have 25 issues resolved within 24 hours",
      icon: "💎",
      category: "reporter",
      criteria: {
        type: "helpful_reports",
        threshold: 25,
        description: "25 issues resolved quickly",
      },
      pointsAwarded: 350,
      rarity: "epic",
      isActive: true,
    },

    // RESOLVER BADGES (for facility managers)
    {
      id: "problem_solver",
      name: "Problem Solver",
      description: "Resolve your first issue",
      icon: "🔧",
      category: "resolver",
      criteria: {
        type: "issues_resolved",
        threshold: 1,
        description: "Resolve 1 issue",
      },
      pointsAwarded: 20,
      rarity: "common",
      isActive: true,
    },
    {
      id: "fix_master",
      name: "Fix Master",
      description: "Resolve 50 infrastructure issues",
      icon: "🛠️",
      category: "resolver",
      criteria: {
        type: "issues_resolved",
        threshold: 50,
        description: "Resolve 50 issues",
      },
      pointsAwarded: 300,
      rarity: "rare",
      isActive: true,
    },
    {
      id: "maintenance_hero",
      name: "Maintenance Hero",
      description: "Resolve 200 infrastructure issues",
      icon: "🦸",
      category: "resolver",
      criteria: {
        type: "issues_resolved",
        threshold: 200,
        description: "Resolve 200 issues",
      },
      pointsAwarded: 800,
      rarity: "legendary",
      isActive: true,
    },

    // POINT MILESTONE BADGES
    {
      id: "bronze_achiever",
      name: "Bronze Achiever",
      description: "Earn 500 reward points",
      icon: "🥉",
      category: "community",
      criteria: {
        type: "points_earned",
        threshold: 500,
        description: "Earn 500 points",
      },
      pointsAwarded: 50,
      rarity: "common",
      isActive: true,
    },
    {
      id: "silver_achiever",
      name: "Silver Achiever",
      description: "Earn 2000 reward points",
      icon: "🥈",
      category: "community",
      criteria: {
        type: "points_earned",
        threshold: 2000,
        description: "Earn 2000 points",
      },
      pointsAwarded: 200,
      rarity: "rare",
      isActive: true,
    },
    {
      id: "gold_achiever",
      name: "Gold Achiever",
      description: "Earn 5000 reward points",
      icon: "🥇",
      category: "community",
      criteria: {
        type: "points_earned",
        threshold: 5000,
        description: "Earn 5000 points",
      },
      pointsAwarded: 500,
      rarity: "epic",
      isActive: true,
    },
    {
      id: "platinum_achiever",
      name: "Platinum Achiever",
      description: "Earn 10000 reward points",
      icon: "💫",
      category: "community",
      criteria: {
        type: "points_earned",
        threshold: 10000,
        description: "Earn 10000 points",
      },
      pointsAwarded: 1000,
      rarity: "legendary",
      isActive: true,
    },
  ];

  try {
    const batch = db.batch();

    badges.forEach((badge) => {
      const ref = db.collection(COLLECTIONS.BADGES).doc(badge.id);
      batch.set(ref, {
        ...badge,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    console.log(`✅ Successfully seeded ${badges.length} badges\n`);

    // Display summary
    const summary = badges.reduce(
      (acc, badge) => {
        acc[badge.category] = (acc[badge.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("📊 Badge Summary by Category:");
    Object.entries(summary).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} badges`);
    });

    console.log("\n🎯 Rarity Distribution:");
    const rarities = badges.reduce(
      (acc, badge) => {
        acc[badge.rarity] = (acc[badge.rarity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    Object.entries(rarities).forEach(([rarity, count]) => {
      console.log(`   ${rarity}: ${count} badges`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding badges:", error);
    process.exit(1);
  }
}

seedBadges();
