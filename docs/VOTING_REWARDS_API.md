# Voting & Rewards API Documentation

Complete API reference for the voting and rewards system.

---

## 🗳️ Voting API

### Cast a Vote

**Endpoint:** `POST /api/issues/:id/vote`

**Description:** Cast an upvote on an issue

**Authentication:** Required (Bearer token)

**Parameters:**

- `id` (path) - Issue ID

**Request:**

```bash
POST /api/issues/issue-123/vote
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Vote cast successfully",
  "data": {
    "voteCount": 15,
    "voted": true
  }
}
```

**Response (Error - 400):**

```json
{
  "success": false,
  "error": "Vote failed",
  "message": "You have already voted on this issue",
  "data": {
    "voteCount": 14
  }
}
```

**Business Rules:**

- One vote per user per issue
- Users cannot vote on their own issues
- Cannot vote on resolved/closed issues
- Awards 2 points to voter
- Awards 5 points to issue reporter

---

### Remove a Vote

**Endpoint:** `DELETE /api/issues/:id/vote`

**Description:** Remove your vote from an issue

**Authentication:** Required

**Request:**

```bash
DELETE /api/issues/issue-123/vote
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Vote removed successfully",
  "data": {
    "voteCount": 14,
    "voted": false
  }
}
```

---

### Get Issue Votes

**Endpoint:** `GET /api/issues/:id/votes`

**Description:** Get all votes for an issue

**Authentication:** Required

**Request:**

```bash
GET /api/issues/issue-123/votes
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "voteCount": 15,
    "voters": [
      {
        "userId": "user-1",
        "votedAt": {
          "_seconds": 1703234567,
          "_nanoseconds": 0
        }
      },
      {
        "userId": "user-2",
        "votedAt": {
          "_seconds": 1703234500,
          "_nanoseconds": 0
        }
      }
    ],
    "hasVoted": true
  }
}
```

---

### Check User Vote

**Endpoint:** `GET /api/issues/:id/vote/check`

**Description:** Check if current user has voted on an issue

**Authentication:** Required

**Request:**

```bash
GET /api/issues/issue-123/vote/check
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "hasVoted": true
  }
}
```

---

### Get User's Voted Issues

**Endpoint:** `GET /api/users/me/votes`

**Description:** Get list of all issues the current user has voted on

**Authentication:** Required

**Request:**

```bash
GET /api/users/me/votes
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "votedIssueIds": ["issue-123", "issue-456", "issue-789"],
    "count": 3
  }
}
```

---

## 🏆 Rewards API

### Get User Rewards

**Endpoint:** `GET /api/users/:id/rewards`

**Description:** Get user's complete reward profile

**Authentication:** Required (users can only view their own rewards unless admin)

**Request:**

```bash
GET /api/users/user-123/rewards
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "rewardPoints": 1250,
    "level": 5,
    "badges": [
      {
        "id": "first_reporter",
        "name": "First Reporter",
        "description": "Report your first issue",
        "icon": "🎯",
        "category": "reporter",
        "rarity": "common",
        "pointsAwarded": 10
      },
      {
        "id": "community_voice",
        "name": "Community Voice",
        "description": "Cast 100 votes",
        "icon": "📢",
        "category": "voter",
        "rarity": "rare",
        "pointsAwarded": 150
      }
    ],
    "statistics": {
      "issuesReported": 45,
      "issuesResolved": 0,
      "votesReceived": 127,
      "votesCast": 103,
      "helpfulReports": 12
    },
    "nextLevelPoints": 2000,
    "levelProgress": 62.5
  }
}
```

---

### Get Current User's Rewards

**Endpoint:** `GET /api/users/me/rewards`

**Description:** Shortcut to get current user's rewards

**Authentication:** Required

**Request:**

```bash
GET /api/users/me/rewards
Authorization: Bearer YOUR_TOKEN
```

**Response:** Same as above

---

### Get Transaction History

**Endpoint:** `GET /api/users/:id/transactions`

**Description:** Get user's reward transaction history

**Authentication:** Required (own profile or admin)

**Query Parameters:**

- `limit` (optional) - Max transactions to return (default: 50)

**Request:**

```bash
GET /api/users/user-123/transactions?limit=20
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "txn-1",
        "userId": "user-123",
        "organizationId": "ggv-bilaspur",
        "type": "vote_received",
        "points": 5,
        "relatedEntityId": "issue-456",
        "relatedEntityType": "issue",
        "description": "Received a vote on your issue",
        "createdAt": {
          "_seconds": 1703234567,
          "_nanoseconds": 0
        }
      },
      {
        "id": "txn-2",
        "userId": "user-123",
        "type": "badge_earned",
        "points": 150,
        "relatedEntityId": "community_voice",
        "relatedEntityType": "badge",
        "description": "Earned badge: Community Voice",
        "createdAt": {
          "_seconds": 1703234500,
          "_nanoseconds": 0
        }
      }
    ],
    "count": 2
  }
}
```

**Transaction Types:**

- `issue_created` (+10 points)
- `vote_received` (+5 points)
- `vote_cast` (+2 points)
- `badge_earned` (varies)
- `helpful_report` (+25 points)
- `issue_resolved` (+50 points for facility managers)
- `admin_bonus` (manual award)
- `penalty` (negative points)

---

## 🎖️ Badges API

### Get All Badges

**Endpoint:** `GET /api/badges`

**Description:** Get list of all available badges

**Authentication:** Required

**Request:**

```bash
GET /api/badges
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "badges": [
      {
        "id": "first_reporter",
        "name": "First Reporter",
        "description": "Report your first infrastructure issue",
        "icon": "🎯",
        "category": "reporter",
        "criteria": {
          "type": "issues_reported",
          "threshold": 1,
          "description": "Report 1 issue"
        },
        "pointsAwarded": 10,
        "rarity": "common",
        "isActive": true
      },
      {
        "id": "issue_hunter",
        "name": "Issue Hunter",
        "description": "Report 50 infrastructure issues",
        "icon": "🔍",
        "category": "reporter",
        "criteria": {
          "type": "issues_reported",
          "threshold": 50,
          "description": "Report 50 issues"
        },
        "pointsAwarded": 200,
        "rarity": "rare",
        "isActive": true
      }
    ],
    "count": 23
  }
}
```

**Badge Categories:**

- `reporter` - For reporting issues
- `voter` - For voting on issues
- `resolver` - For facility managers who fix issues
- `community` - General milestones
- `special` - Custom achievements

**Badge Rarities:**

- `common` (10-50 points)
- `rare` (100-200 points)
- `epic` (250-500 points)
- `legendary` (750-1000 points)

---

### Get Badge Details

**Endpoint:** `GET /api/badges/:id`

**Description:** Get details of a specific badge

**Authentication:** Required

**Query Parameters:**

- `includeAchievers` (optional) - Include list of users who earned this badge

**Request:**

```bash
GET /api/badges/community_voice?includeAchievers=true
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "badge": {
      "id": "community_voice",
      "name": "Community Voice",
      "description": "Cast 100 votes to help prioritize issues",
      "icon": "📢",
      "category": "voter",
      "criteria": {
        "type": "votes_cast",
        "threshold": 100,
        "description": "Vote on 100 issues"
      },
      "pointsAwarded": 150,
      "rarity": "rare",
      "isActive": true
    },
    "achievers": [
      {
        "userId": "user-123",
        "userName": "Deepak Soni",
        "earnedAt": {
          "_seconds": 1703234567,
          "_nanoseconds": 0
        }
      },
      {
        "userId": "user-456",
        "userName": "John Doe",
        "earnedAt": {
          "_seconds": 1703234500,
          "_nanoseconds": 0
        }
      }
    ],
    "achieverCount": 2
  }
}
```

---

## 📊 Leaderboard API

### Get Leaderboard

**Endpoint:** `GET /api/leaderboard`

**Description:** Get leaderboard rankings

**Authentication:** Required

**Query Parameters:**

- `organizationId` (required) - Organization ID
- `period` (optional) - `all_time`, `monthly`, or `weekly` (default: `all_time`)
- `limit` (optional) - Max entries (default: 100)

**Request:**

```bash
GET /api/leaderboard?organizationId=ggv-bilaspur&period=monthly&limit=20
Authorization: Bearer YOUR_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "id": "all_time_user-123",
        "userId": "user-123",
        "organizationId": "ggv-bilaspur",
        "userName": "Deepak Soni",
        "userRole": "student",
        "rewardPoints": 2500,
        "level": 6,
        "rank": 1,
        "issuesReported": 87,
        "votesReceived": 234,
        "badges": ["first_reporter", "issue_hunter", "community_voice"],
        "period": "all_time",
        "updatedAt": {
          "_seconds": 1703234567,
          "_nanoseconds": 0
        }
      },
      {
        "userId": "user-456",
        "userName": "John Doe",
        "userRole": "student",
        "rewardPoints": 1800,
        "level": 5,
        "rank": 2,
        "issuesReported": 62,
        "votesReceived": 145,
        "badges": ["first_reporter", "active_reporter"],
        "period": "all_time"
      }
    ],
    "period": "monthly",
    "count": 20
  }
}
```

---

## 👨‍💼 Admin API

### Award Points (Admin Only)

**Endpoint:** `POST /api/admin/users/:id/award-points`

**Description:** Manually award points to a user

**Authentication:** Required (Admin only)

**Request:**

```bash
POST /api/admin/users/user-123/award-points
Authorization: Bearer YOUR_ADMIN_TOKEN
Content-Type: application/json

{
  "points": 100,
  "description": "Excellent bug report with detailed screenshots"
}
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Awarded 100 points to user"
}
```

---

### Check Badges (Admin Only)

**Endpoint:** `POST /api/admin/users/:id/check-badges`

**Description:** Manually trigger badge eligibility check for a user

**Authentication:** Required (Admin only)

**Request:**

```bash
POST /api/admin/users/user-123/check-badges
Authorization: Bearer YOUR_ADMIN_TOKEN
```

**Response (Success - 200):**

```json
{
  "success": true,
  "message": "Checked badges for user",
  "data": {
    "newBadges": [
      {
        "id": "issue_hunter",
        "name": "Issue Hunter",
        "description": "Report 50 infrastructure issues",
        "pointsAwarded": 200
      }
    ],
    "count": 1
  }
}
```

---

## 🔒 Authentication

All endpoints require authentication via Firebase ID token.

**Header Format:**

```
Authorization: Bearer YOUR_FIREBASE_ID_TOKEN
```

**Getting a Token (Frontend):**

```typescript
import { auth } from "@/lib/firebase";

const user = auth.currentUser;
if (user) {
  const token = await user.getIdToken();
  // Use token in Authorization header
}
```

---

## 📝 Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "No authentication token provided"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Forbidden",
  "message": "You can only view your own rewards"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Not found",
  "message": "Badge not found"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Failed to cast vote"
}
```

---

## 💡 Usage Examples

### Vote on Issue and Get Updated Data

```javascript
// Vote on issue
const voteResponse = await fetch(`/api/issues/${issueId}/vote`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const voteData = await voteResponse.json();
console.log(`Issue now has ${voteData.data.voteCount} votes`);

// Get user's updated rewards
const rewardsResponse = await fetch("/api/users/me/rewards", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const rewards = await rewardsResponse.json();
console.log(`You now have ${rewards.data.rewardPoints} points!`);
```

### Check for New Badges After Action

```javascript
// After user performs an action (report issue, vote, etc.)
const newBadges = await checkAndAwardBadges(userId, organizationId);

if (newBadges.length > 0) {
  // Show badge earned notification
  newBadges.forEach((badge) => {
    showNotification(
      `🎉 Badge Earned: ${badge.name}! +${badge.pointsAwarded} points`
    );
  });
}
```

### Display Leaderboard

```javascript
const response = await fetch(
  `/api/leaderboard?organizationId=${orgId}&period=monthly&limit=10`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

const { leaderboard } = await response.json().data;

leaderboard.forEach((entry, index) => {
  console.log(
    `${index + 1}. ${entry.userName} - ${entry.rewardPoints} points (Level ${
      entry.level
    })`
  );
});
```

---

## 🎯 Best Practices

1. **Cache Leaderboard:** Leaderboard data is computationally expensive. Cache on frontend for 5-10 minutes.

2. **Optimistic UI:** Show vote immediately in UI, rollback if API fails.

3. **Badge Notifications:** Listen for new badges after point-awarding actions and show celebration UI.

4. **Vote Counts:** Display vote counts prominently to encourage community participation.

5. **Progress Bars:** Show progress towards next level and next badges to motivate users.

6. **Transaction History:** Paginate transaction history for performance.

---

**Last Updated:** December 22, 2024
