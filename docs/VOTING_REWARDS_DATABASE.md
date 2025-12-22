# Voting & Rewards System - Database Schema

## Overview

This document describes the database schema changes for implementing:

1. **Voting System** - Users can vote on issues to influence priority
2. **Rewards & Badges** - Gamification system to encourage participation

---

## 🗳️ Voting System

### Issues Collection (Updated)

Added fields to existing `issues` collection:

```typescript
{
  // ... existing fields ...

  // NEW: Voting fields
  voteCount: number,        // Total upvotes (default: 0)
  votedBy: string[],        // Array of user IDs who voted
}
```

**Rules:**

- One vote per user per issue
- Users cannot vote on their own issues
- Vote count directly impacts priority score calculation
- Votes are permanent (no downvoting or vote removal for now)

---

### Votes Collection (New)

Tracks individual vote records for analytics and audit trail.

**Collection:** `votes`

```typescript
{
  id: string,              // Auto-generated document ID
  issueId: string,         // Reference to issue
  userId: string,          // User who voted
  organizationId: string,  // For multi-tenancy
  createdAt: Timestamp     // When vote was cast
}
```

**Indexes:**

- `issueId` (for counting votes per issue)
- `userId` (for finding user's votes)
- `organizationId` + `createdAt` (for analytics)

**Composite Index:**

- `issueId` + `userId` (to prevent duplicate votes)

---

## 🏆 Rewards & Badges System

### Users Collection (Updated)

Enhanced user profile with gamification fields:

```typescript
{
  // ... existing fields ...

  // NEW: Rewards fields
  rewardPoints: number,    // Total points earned (default: 0)
  level: number,           // User level 1-10 based on points (default: 1)
  badges: string[],        // Array of badge IDs earned

  statistics: {
    issuesReported: number,      // Total issues created
    issuesResolved: number,      // For facility managers
    votesReceived: number,       // Votes on their issues
    votesCast: number,           // Times they voted
    helpfulReports: number       // Issues resolved quickly
  }
}
```

**Level Calculation:**

```typescript
Level 1: 0-100 points
Level 2: 100-250 points
Level 3: 250-500 points
Level 4: 500-1000 points
Level 5: 1000-2000 points
Level 6: 2000-3500 points
Level 7: 3500-5500 points
Level 8: 5500-8000 points
Level 9: 8000-12000 points
Level 10: 12000+ points
```

---

### Badges Collection (New)

Defines all available badges/achievements.

**Collection:** `badges`

```typescript
{
  id: string,                    // Badge identifier
  name: string,                  // Display name (e.g., "First Report")
  description: string,           // What it's for
  icon: string,                  // Emoji or icon identifier
  category: BadgeCategory,       // reporter|voter|resolver|community|special

  criteria: {
    type: CriteriaType,          // What triggers this badge
    threshold: number,           // How many needed
    description: string          // Human-readable requirement
  },

  pointsAwarded: number,         // Points given when earned
  rarity: "common" | "rare" | "epic" | "legendary",
  isActive: boolean,
  createdAt: Timestamp
}
```

**Criteria Types:**

- `issues_reported` - Create X issues
- `votes_received` - Get X votes on your issues
- `votes_cast` - Vote on X issues
- `issues_resolved` - Resolve X issues (facility managers)
- `helpful_reports` - X issues resolved within 24 hours
- `streak_days` - Active for X consecutive days
- `points_earned` - Reach X points
- `custom` - Special badges

**Example Badges:**

```typescript
// Beginner badge
{
  id: "first_reporter",
  name: "First Reporter",
  description: "Report your first issue",
  icon: "🎯",
  category: "reporter",
  criteria: { type: "issues_reported", threshold: 1, description: "Report 1 issue" },
  pointsAwarded: 10,
  rarity: "common"
}

// Power user badge
{
  id: "issue_hunter",
  name: "Issue Hunter",
  description: "Report 50 infrastructure issues",
  icon: "🔍",
  category: "reporter",
  criteria: { type: "issues_reported", threshold: 50, description: "Report 50 issues" },
  pointsAwarded: 200,
  rarity: "rare"
}

// Community badge
{
  id: "community_voice",
  name: "Community Voice",
  description: "Cast 100 votes to help prioritize issues",
  icon: "🗳️",
  category: "voter",
  criteria: { type: "votes_cast", threshold: 100, description: "Vote on 100 issues" },
  pointsAwarded: 150,
  rarity: "rare"
}

// Popular reporter badge
{
  id: "crowd_favorite",
  name: "Crowd Favorite",
  description: "Receive 50 votes on your reported issues",
  icon: "⭐",
  category: "reporter",
  criteria: { type: "votes_received", threshold: 50, description: "Get 50 votes" },
  pointsAwarded: 250,
  rarity: "epic"
}
```

---

### User Badges Collection (New)

Junction table tracking which badges users have earned.

**Collection:** `user_badges`

```typescript
{
  id: string,              // Auto-generated
  userId: string,          // User who earned it
  badgeId: string,         // Badge earned
  organizationId: string,  // For multi-tenancy
  earnedAt: Timestamp,     // When achieved
  progress?: number        // For tracking towards next tier
}
```

**Indexes:**

- `userId` (to fetch all user's badges)
- `badgeId` (to see who has a badge)
- `userId` + `badgeId` (unique constraint)

---

### Reward Transactions Collection (New)

Audit log of all point awards and deductions.

**Collection:** `reward_transactions`

```typescript
{
  id: string,
  userId: string,
  organizationId: string,

  type: TransactionType,     // What triggered this
  points: number,            // + for awards, - for penalties

  relatedEntityId?: string,  // Issue/Badge ID
  relatedEntityType?: string,// "issue", "badge", "vote"

  description: string,       // Human-readable reason
  createdAt: Timestamp
}
```

**Transaction Types:**

- `issue_created` (+10 points)
- `issue_resolved` (+50 points for facility managers)
- `vote_received` (+5 points per vote)
- `vote_cast` (+2 points)
- `badge_earned` (varies by badge)
- `helpful_report` (+25 bonus points)
- `admin_bonus` (manual award)
- `penalty` (negative points)

**Indexes:**

- `userId` + `createdAt` (user's transaction history)
- `organizationId` + `type` + `createdAt` (analytics)

---

### Leaderboard Collection (New)

Cached leaderboard data for performance.

**Collection:** `leaderboard`

```typescript
{
  id: string,                    // period + userId
  userId: string,
  organizationId: string,
  userName: string,
  userRole: string,

  rewardPoints: number,
  level: number,
  rank: number,                  // 1, 2, 3, etc.

  issuesReported: number,
  votesReceived: number,
  badges: string[],

  period: "all_time" | "monthly" | "weekly",
  updatedAt: Timestamp
}
```

**Purpose:**

- Pre-computed rankings for fast display
- Updated nightly or when points change
- Separate entries for all-time, monthly, weekly

---

## 📊 Impact on Priority Calculation

### Current Priority Engine

The priority engine uses multiple factors to calculate issue priority (0-100 score).

### NEW: Vote Weight Factor

Votes now contribute to the priority score:

```typescript
// Vote influence (0-20 points)
const voteWeight = Math.min(issue.voteCount * 0.5, 20);

// Updated total score
const priorityScore =
  severityScore + locationScore + timeScore + contextScore + voteWeight; // NEW
```

**Formula:**

- Each vote adds 0.5 points to priority
- Capped at 20 points (40 votes)
- Ensures high-voted issues rise in priority
- Critical issues still prioritized even with fewer votes

---

## 🔐 Firestore Security Rules

Update security rules to handle new collections:

```javascript
// Votes collection
match /votes/{voteId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() &&
                request.auth.uid == request.resource.data.userId;
  allow delete, update: if false; // Votes are permanent
}

// Badges collection (read-only for users)
match /badges/{badgeId} {
  allow read: if isAuthenticated();
  allow write: if hasRole('admin');
}

// User badges
match /user_badges/{userBadgeId} {
  allow read: if isAuthenticated();
  allow create: if hasRole('admin') || isSystemService();
  allow update, delete: if hasRole('admin');
}

// Reward transactions (read-only for users)
match /reward_transactions/{transactionId} {
  allow read: if isAuthenticated() &&
              resource.data.userId == request.auth.uid;
  allow create: if isSystemService(); // Backend only
  allow update, delete: if false;
}

// Leaderboard (public read)
match /leaderboard/{leaderboardId} {
  allow read: if isAuthenticated();
  allow write: if hasRole('admin') || isSystemService();
}
```

---

## 🎯 Points Allocation Strategy

### Earning Points

| Action                        | Points | Notes                     |
| ----------------------------- | ------ | ------------------------- |
| Report an issue               | +10    | Base reward               |
| Receive a vote                | +5     | Per vote on your issue    |
| Cast a vote                   | +2     | Encourage participation   |
| Issue resolved quickly (<24h) | +25    | Bonus for helpful reports |
| Resolve an issue (FM)         | +50    | For facility managers     |
| Earn a badge                  | Varies | Based on badge rarity     |

### Badge Points

| Rarity    | Points   |
| --------- | -------- |
| Common    | 10-50    |
| Rare      | 100-200  |
| Epic      | 250-500  |
| Legendary | 750-1000 |

---

## 🚀 Migration Plan

### Phase 1: Add Fields to Existing Collections

```typescript
// Update existing issues
db.collection("issues")
  .get()
  .then((snapshot) => {
    snapshot.docs.forEach((doc) => {
      doc.ref.update({
        voteCount: 0,
        votedBy: [],
      });
    });
  });

// Update existing users
db.collection("users")
  .get()
  .then((snapshot) => {
    snapshot.docs.forEach((doc) => {
      doc.ref.update({
        rewardPoints: 0,
        level: 1,
        badges: [],
        statistics: {
          issuesReported: 0,
          issuesResolved: 0,
          votesReceived: 0,
          votesCast: 0,
          helpfulReports: 0,
        },
      });
    });
  });
```

### Phase 2: Create New Collections

1. Create `badges` collection with initial badge definitions
2. Create empty `votes`, `user_badges`, `reward_transactions` collections
3. Set up composite indexes

### Phase 3: Backfill Statistics

```typescript
// Calculate existing user statistics
const issues = await db.collection("issues").get();
const userStats = {};

issues.forEach((issue) => {
  const reporterId = issue.data().reportedBy;
  if (!userStats[reporterId]) {
    userStats[reporterId] = { issuesReported: 0 };
  }
  userStats[reporterId].issuesReported++;
});

// Update users with calculated stats
for (const [userId, stats] of Object.entries(userStats)) {
  await db.collection("users").doc(userId).update({
    "statistics.issuesReported": stats.issuesReported,
  });
}
```

---

## 📈 Analytics & Reporting

### Key Metrics to Track

1. **Engagement Metrics**

   - Daily active voters
   - Average votes per issue
   - Vote distribution by issue category

2. **Gamification Metrics**

   - Points earned per user/day
   - Badge unlock rate
   - Level distribution across users

3. **Impact Metrics**
   - Correlation: votes vs resolution time
   - Vote accuracy (voted issues actually critical?)
   - User retention after earning badges

---

## 🎨 UI/UX Considerations

### Issue List

- Show vote count prominently
- Visual indicator if user has voted
- One-click voting button
- Sort by: votes, priority, recency

### Profile Page

- Display total points and level
- Show all earned badges with dates
- Transaction history
- Progress towards next level/badges

### Leaderboard

- All-time, monthly, weekly tabs
- Top 10/50/100 users
- Filter by role (students, staff, etc.)
- Show badges on leaderboard

---

## 🔄 Future Enhancements

1. **Vote Comments** - Allow users to explain why they voted
2. **Vote Decay** - Older votes count less
3. **Badge Tiers** - Bronze/Silver/Gold versions
4. **Team Challenges** - Department competitions
5. **Redemption Store** - Spend points on perks
6. **Vote Notifications** - Alert when issue gets votes
7. **Trending Issues** - Algorithm based on vote velocity

---

## 📝 Next Steps

1. ✅ Update TypeScript types (`Issue`, `User`, new interfaces)
2. ✅ Add COLLECTIONS constants
3. ⏳ Update Firestore security rules
4. ⏳ Create migration scripts
5. ⏳ Seed initial badges
6. ⏳ Update priority engine
7. ⏳ Build voting API endpoints
8. ⏳ Build rewards API endpoints
9. ⏳ Update frontend UI

---

**Last Updated:** December 22, 2024
