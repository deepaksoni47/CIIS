# Quick Start: Voting & Rewards Migration

## 🚀 Step-by-Step Guide

### Prerequisites

- Backend environment configured with Firebase credentials
- Database backup (recommended)

---

## Migration Steps

### 1. Update Database Schema

Run the migration script to update existing data:

```bash
cd backend
npm run migrate:voting-rewards
```

**What it does:**

- ✅ Adds `voteCount` and `votedBy` to all issues
- ✅ Adds `rewardPoints`, `level`, `badges`, and `statistics` to all users
- ✅ Calculates existing user statistics
- ✅ Backfills points for existing activity
- ✅ Creates transaction records

**Expected output:**

```
🔄 Starting database migration for Voting & Rewards system...
1️⃣ Updating Issues collection...
   ✅ Updated 156 issues with voting fields
2️⃣ Updating Users collection...
   ✅ Updated 45 users with rewards fields
3️⃣ Backfilling reward points for existing activity...
   ✅ Awarded 3,450 total points for existing activity
✅ Migration completed successfully!
```

---

### 2. Seed Badge Definitions

Create the initial set of 23 badges:

```bash
npm run seed:badges
```

**What it does:**

- ✅ Creates 23 badges across 5 categories
- ✅ Defines criteria and point values
- ✅ Sets rarity levels

**Expected output:**

```
🏆 Seeding initial badges...
✅ Successfully seeded 23 badges

📊 Badge Summary by Category:
   reporter: 7 badges
   voter: 4 badges
   resolver: 3 badges
   community: 4 badges
```

---

### 3. Create Firestore Indexes

**Option A: Via Firebase Console**

Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Indexes

Create these composite indexes:

1. **votes** collection:

   - Fields: `issueId` (Ascending), `userId` (Ascending)
   - Purpose: Prevent duplicate votes

2. **user_badges** collection:

   - Fields: `userId` (Ascending), `badgeId` (Ascending)
   - Purpose: Unique constraint

3. **reward_transactions** collection:

   - Fields: `userId` (Ascending), `createdAt` (Descending)
   - Purpose: User transaction history

4. **leaderboard** collection:
   - Fields: `organizationId` (Ascending), `period` (Ascending), `rank` (Ascending)
   - Purpose: Efficient leaderboard queries

**Option B: Via Firebase CLI**

Create `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "votes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "issueId", "order": "ASCENDING" },
        { "fieldPath": "userId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "user_badges",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "badgeId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "reward_transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "leaderboard",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "organizationId", "order": "ASCENDING" },
        { "fieldPath": "period", "order": "ASCENDING" },
        { "fieldPath": "rank", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Deploy:

```bash
firebase deploy --only firestore:indexes
```

---

### 4. Update Firestore Security Rules

Add these rules to your `firestore.rules`:

```javascript
// In firestore.rules, add to the existing rules

// Votes collection
match /votes/{voteId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() &&
                request.auth.uid == request.resource.data.userId &&
                !exists(/databases/$(database)/documents/votes/$(voteId));
  allow delete, update: if false; // Votes are permanent
}

// Badges collection (read-only for users)
match /badges/{badgeId} {
  allow read: if isAuthenticated();
  allow write: if hasRole('admin');
}

// User badges (controlled by backend)
match /user_badges/{userBadgeId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if hasRole('admin');
}

// Reward transactions (read own only)
match /reward_transactions/{transactionId} {
  allow read: if isAuthenticated() &&
              resource.data.userId == request.auth.uid;
  allow create, update, delete: if false; // Backend only via admin SDK
}

// Leaderboard (public read within org)
match /leaderboard/{leaderboardId} {
  allow read: if isAuthenticated();
  allow write: if false; // Backend only via admin SDK
}
```

Deploy:

```bash
firebase deploy --only firestore:rules
```

---

## Verification

### Check Issues Have Voting Fields

```bash
npm run test:firestore
```

Or manually in Firestore Console:

1. Go to `issues` collection
2. Click any document
3. Verify fields exist: `voteCount: 0`, `votedBy: []`

### Check Users Have Rewards Fields

In Firestore Console:

1. Go to `users` collection
2. Click any document
3. Verify fields:
   - `rewardPoints: <number>`
   - `level: <number>`
   - `badges: []`
   - `statistics: { ... }`

### Check Badges Were Created

In Firestore Console:

1. Go to `badges` collection
2. Should see 23 documents
3. Click any badge to see structure

---

## Troubleshooting

### Migration Script Errors

**Error: "Cannot read property 'organizationId' of undefined"**

- Some users missing organizationId field
- Fix: Update seed scripts to include organizationId for all users

**Error: "Insufficient permissions"**

- Firebase credentials not configured
- Fix: Check `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable

### Index Creation Errors

**Error: "Index already exists"**

- Firestore automatically created the index
- Solution: Check existing indexes, skip if already present

### Rule Deployment Errors

**Error: "Function 'hasRole' is not defined"**

- Missing helper function in rules
- Solution: Add helper functions at the top of rules file:

```javascript
function hasRole(role) {
  return isAuthenticated() &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role;
}
```

---

## Rollback (If Needed)

If something goes wrong, you can rollback:

### 1. Remove New Fields from Issues

```typescript
// Run this script to remove voting fields
const issues = await db.collection("issues").get();
const batch = db.batch();
issues.docs.forEach((doc) => {
  batch.update(doc.ref, {
    voteCount: admin.firestore.FieldValue.delete(),
    votedBy: admin.firestore.FieldValue.delete(),
  });
});
await batch.commit();
```

### 2. Remove New Fields from Users

```typescript
const users = await db.collection("users").get();
const batch = db.batch();
users.docs.forEach((doc) => {
  batch.update(doc.ref, {
    rewardPoints: admin.firestore.FieldValue.delete(),
    level: admin.firestore.FieldValue.delete(),
    badges: admin.firestore.FieldValue.delete(),
    statistics: admin.firestore.FieldValue.delete(),
  });
});
await batch.commit();
```

### 3. Delete New Collections

```typescript
// Delete badges
await db
  .collection("badges")
  .listDocuments()
  .then((docs) => {
    docs.forEach((doc) => doc.delete());
  });

// Delete other new collections similarly
```

---

## Next Steps After Migration

1. ✅ Implement Voting API endpoints
2. ✅ Implement Rewards API endpoints
3. ✅ Update frontend Issue List with voting UI
4. ✅ Update frontend Profile Page with rewards display
5. ✅ Create Leaderboard page
6. ✅ Create Badges page
7. ✅ Add real-time vote updates via WebSocket/SSE

---

## Testing Checklist

After migration:

- [ ] Users have initial points based on past activity
- [ ] Issues have voteCount: 0 and empty votedBy array
- [ ] All 23 badges exist in database
- [ ] Firestore indexes are building/built
- [ ] Security rules deployed and working
- [ ] Can query users by rewardPoints
- [ ] Can query issues by voteCount
- [ ] Transaction records exist for backfilled points

---

## Support

For issues or questions:

1. Check `docs/VOTING_REWARDS_DATABASE.md` for detailed schema info
2. Check `VOTING_REWARDS_IMPLEMENTATION.md` for full implementation guide
3. Review error logs in backend console

**Migration Date:** **\_\_\_**
**Migrated By:** **\_\_\_**
**Issues Processed:** **\_\_\_**
**Users Updated:** **\_\_\_**
**Badges Created:** 23
**Total Points Awarded:** **\_\_\_**
