# Voting & Rewards System - Implementation Summary

## 🎉 Database Schema Updates - COMPLETED

All database schema changes have been successfully implemented for the **Voting** and **Rewards & Badges** systems.

---

## ✅ What Was Updated

### 1. TypeScript Type Definitions (`backend/src/types/index.ts`)

#### Updated Interfaces:

- **`Issue`** interface:

  - Added `voteCount: number` - Total upvotes
  - Added `votedBy: string[]` - Array of user IDs who voted

- **`User`** interface:
  - Added `rewardPoints: number` - Total points earned
  - Added `level: number` - User level (1-10)
  - Added `badges: string[]` - Array of earned badge IDs
  - Added `statistics` object:
    ```typescript
    statistics: {
      issuesReported: number;
      issuesResolved: number;
      votesReceived: number;
      votesCast: number;
      helpfulReports: number;
    }
    ```

#### New Interfaces Added:

- **`Vote`** - Individual vote records
- **`Badge`** - Badge/achievement definitions
- **`UserBadge`** - User-earned badges (junction table)
- **`RewardTransaction`** - Audit log for points
- **`LeaderboardEntry`** - Cached leaderboard data

### 2. Firebase Collections (`backend/src/config/firebase.ts`)

Added new collection constants:

```typescript
COLLECTIONS = {
  // ... existing ...
  VOTES: "votes",
  BADGES: "badges",
  USER_BADGES: "user_badges",
  REWARD_TRANSACTIONS: "reward_transactions",
  LEADERBOARD: "leaderboard",
};
```

### 3. Priority Engine (`backend/src/modules/priority/priority-engine.ts`)

Updated priority calculation to include **vote influence**:

- Added `voteCount` to `PriorityInput` interface
- Added `voteScore` to breakdown in `PriorityScore`
- Implemented `calculateVoteScore()` method:
  - Logarithmic scaling: more votes = higher priority
  - Capped at 70 points to prevent overriding critical issues
  - 10% weight in overall priority calculation
- Updated reasoning to mention community votes

**Vote Impact Examples:**

- 1 vote = 10 points
- 5 votes = 23 points
- 10 votes = 33 points
- 20 votes = 43 points
- 50 votes = 57 points
- 100+ votes = 67 points (capped at 70)

### 4. Migration Scripts

Created two essential scripts:

#### `backend/src/scripts/migrate-voting-rewards.ts`

Migrates existing database:

- Adds `voteCount: 0` and `votedBy: []` to all issues
- Adds rewards fields to all users
- Backfills statistics from existing data
- Awards points for past activity
- Creates transaction records

**Run with:** `npm run migrate:voting-rewards`

#### `backend/src/scripts/seed-badges.ts`

Seeds initial badge definitions:

- 23 badges across 5 categories
- Reporter badges (7)
- Voter badges (4)
- Popular reporter badges (3)
- Helpful reporter badges (2)
- Resolver badges (3)
- Point milestone badges (4)

**Run with:** `npm run seed:badges`

### 5. Documentation

Created comprehensive docs:

- **`docs/VOTING_REWARDS_DATABASE.md`** - Full schema documentation with:
  - Collection structures
  - Index requirements
  - Points allocation strategy
  - Badge definitions
  - UI/UX considerations
  - Migration plan
  - Future enhancements

---

## 🎯 Badge System

### Categories:

1. **Reporter** - For reporting issues
2. **Voter** - For voting on issues
3. **Resolver** - For facility managers who fix issues
4. **Community** - General milestones
5. **Special** - Custom achievements

### Rarity Tiers:

- **Common** (10-50 points)
- **Rare** (100-200 points)
- **Epic** (250-500 points)
- **Legendary** (750-1000 points)

### Example Badges:

- 🎯 **First Reporter** - Report your first issue (10 pts)
- 🔍 **Issue Hunter** - Report 50 issues (200 pts)
- 🗳️ **Community Voice** - Cast 100 votes (150 pts)
- ⭐ **Crowd Favorite** - Receive 50 votes (250 pts)
- 🦸 **Maintenance Hero** - Resolve 200 issues (800 pts)

---

## 📊 Points System

### How Users Earn Points:

| Action                        | Points | Notes                     |
| ----------------------------- | ------ | ------------------------- |
| Report an issue               | +10    | Base reward               |
| Receive a vote                | +5     | Per vote on your issue    |
| Cast a vote                   | +2     | Encourage participation   |
| Issue resolved quickly (<24h) | +25    | Bonus for helpful reports |
| Resolve an issue (FM)         | +50    | For facility managers     |
| Earn a badge                  | Varies | Based on rarity (10-1000) |

### User Levels:

```
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

## 🗳️ Voting System

### Features:

- One vote per user per issue
- Users cannot vote on their own issues
- Votes are permanent (no removal)
- Vote count directly impacts priority score
- Audit trail in `votes` collection

### Priority Impact:

- Votes contribute **10%** to overall priority score
- Logarithmic scaling ensures fairness
- High-voted issues rise in priority
- Critical infrastructure still prioritized

---

## 🔐 Security Considerations

### Firestore Security Rules (Need to Add):

```javascript
// Votes - users can create, cannot delete
match /votes/{voteId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() &&
                request.auth.uid == request.resource.data.userId;
  allow delete, update: if false;
}

// Badges - read-only for users
match /badges/{badgeId} {
  allow read: if isAuthenticated();
  allow write: if hasRole('admin');
}

// User badges - controlled by backend
match /user_badges/{userBadgeId} {
  allow read: if isAuthenticated();
  allow create: if isSystemService();
  allow update, delete: if hasRole('admin');
}

// Transactions - read own only
match /reward_transactions/{transactionId} {
  allow read: if isAuthenticated() &&
              resource.data.userId == request.auth.uid;
  allow write: if isSystemService();
}

// Leaderboard - public read
match /leaderboard/{leaderboardId} {
  allow read: if isAuthenticated();
  allow write: if isSystemService();
}
```

---

## 📝 Next Steps

### Backend API (To Be Implemented):

1. **Voting Endpoints:**

   - `POST /api/issues/:id/vote` - Cast a vote
   - `DELETE /api/issues/:id/vote` - Remove vote (if we allow it)
   - `GET /api/issues/:id/votes` - Get vote count and voters

2. **Rewards Endpoints:**

   - `GET /api/users/:id/rewards` - Get user's points, level, badges
   - `GET /api/users/:id/transactions` - Transaction history
   - `GET /api/badges` - List all badges
   - `GET /api/badges/:id` - Badge details with achievers

3. **Leaderboard Endpoints:**

   - `GET /api/leaderboard` - Overall leaderboard
   - `GET /api/leaderboard/weekly` - Weekly rankings
   - `GET /api/leaderboard/monthly` - Monthly rankings

4. **Admin Endpoints:**
   - `POST /api/admin/badges` - Create custom badge
   - `POST /api/admin/users/:id/award-points` - Manual point award
   - `POST /api/admin/users/:id/award-badge` - Manual badge award

### Frontend Components (To Be Implemented):

1. **Issue List:**

   - Vote button on each issue
   - Vote count display
   - Visual indicator if user has voted
   - Sort by votes option

2. **Profile Page Updates:**

   - Points and level display with progress bar
   - Badges grid with tooltips
   - Transaction history list
   - Statistics dashboard

3. **Leaderboard Page:**

   - All-time / Monthly / Weekly tabs
   - Top users with avatars
   - Points, level, and badges shown
   - Filter by role

4. **Badges Page:**
   - All badges grid
   - Locked/unlocked states
   - Progress towards next badge
   - Badge details modal

### Database Tasks:

1. ✅ Run migration: `npm run migrate:voting-rewards`
2. ✅ Seed badges: `npm run seed:badges`
3. ⏳ Create Firestore composite indexes
4. ⏳ Update Firestore security rules
5. ⏳ Test with sample data

---

## 🚀 Running the Migration

### Step 1: Backup Data

```bash
# Export your Firestore data first (optional but recommended)
gcloud firestore export gs://YOUR_BUCKET/backup
```

### Step 2: Run Migration

```bash
cd backend
npm run migrate:voting-rewards
```

This will:

- Add voting fields to existing issues
- Add rewards fields to existing users
- Calculate and backfill statistics
- Award points for past activity

### Step 3: Seed Badges

```bash
npm run seed:badges
```

This creates 23 initial badges in the database.

### Step 4: Create Indexes

In Firebase Console → Firestore → Indexes, create:

1. `votes`: issueId (Asc) + userId (Asc)
2. `user_badges`: userId (Asc) + badgeId (Asc)
3. `reward_transactions`: userId (Asc) + createdAt (Desc)
4. `leaderboard`: organizationId (Asc) + period (Asc) + rank (Asc)

---

## 📈 Analytics to Track

### Engagement Metrics:

- Daily active voters
- Average votes per issue
- Vote distribution by category
- Most voted issues

### Gamification Metrics:

- Points earned per user/day
- Badge unlock rate
- Level distribution
- User retention after earning badges

### Impact Metrics:

- Correlation: votes vs resolution time
- Vote accuracy (were highly-voted issues actually critical?)
- User activity increase after gamification

---

## 🎨 UI Mockup Ideas

### Issue Card with Voting:

```
┌─────────────────────────────────────┐
│ 🔌 Broken AC in Classroom 201      │
│ Building: Engineering | Priority: 🔴│
│                                     │
│ 47 students affected...             │
│                                     │
│ ┌─────┐  👍 23 votes  🕒 2 days   │
│ │ 👍  │  [Vote] ←you haven't voted │
│ └─────┘                             │
└─────────────────────────────────────┘
```

### Profile Rewards Section:

```
┌─────────────────────────────────────┐
│ 🏆 Rewards & Achievements           │
├─────────────────────────────────────┤
│ Level 5 - Active Contributor        │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░ 1,247 / 2,000   │
│                                     │
│ 🥉 Bronze  🥈 Silver  🥇 Gold       │
│ ✅ Earned  🔒 Locked  ⏳ In Progress│
│                                     │
│ Recent Badges:                      │
│ 🔍 Issue Hunter  (+200 pts)        │
│ 📢 Community Voice  (+150 pts)     │
└─────────────────────────────────────┘
```

---

## ⚠️ Important Notes

1. **Vote Validation:** The backend API must prevent:

   - Users voting on their own issues
   - Duplicate votes from the same user
   - Voting on resolved/closed issues (optional)

2. **Points Calculation:** Use transactions when awarding points to prevent race conditions:

   ```typescript
   await db.runTransaction(async (transaction) => {
     const userRef = db.collection("users").doc(userId);
     const userDoc = await transaction.get(userRef);
     const currentPoints = userDoc.data().rewardPoints;
     transaction.update(userRef, {
       rewardPoints: currentPoints + pointsToAward,
     });
   });
   ```

3. **Badge Checking:** Implement a badge-checking service that:

   - Runs after each point-awarding action
   - Checks if user meets criteria for any new badges
   - Awards badge and points if earned
   - Sends notification to user

4. **Leaderboard Updates:** Consider:
   - Updating leaderboard nightly (for performance)
   - Real-time updates for top 10 only
   - Separate leaderboards per organization

---

## 🎯 Success Metrics

After deployment, track:

- **User Engagement:** % of users who vote
- **Issue Quality:** Do voted issues get resolved faster?
- **Community Health:** Distribution of points across users
- **Badge Completion:** % of users earning at least one badge
- **Retention:** Do gamification features increase return visits?

---

**Status:** ✅ Database schema complete, ready for API implementation

**Last Updated:** December 22, 2024
