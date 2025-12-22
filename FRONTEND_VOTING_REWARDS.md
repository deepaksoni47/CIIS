# Frontend Implementation - Voting & Rewards System

## Overview

Complete frontend implementation for the voting and rewards system, including voting buttons, rewards profile, badges collection, and leaderboard.

## 📁 Files Created

### API Services

- **`frontend/src/lib/api/rewards.ts`** - Complete API client for all voting and rewards endpoints

### Components

#### Voting Components

- **`frontend/src/components/voting/VoteButton.tsx`**
  - Interactive vote/unvote button with optimistic UI
  - Shows vote count and user's vote status
  - Auto-checks user's vote status on mount
  - Prevents voting without authentication
  - Supports 3 sizes: sm, md, lg

#### Rewards Components

- **`frontend/src/components/rewards/RewardsProfile.tsx`**

  - Displays user's level, points, and progress to next level
  - Statistics grid showing all user achievements
  - Recent badges preview
  - Gradient cards with icons and animations

- **`frontend/src/components/rewards/BadgeCard.tsx`**
  - Individual badge card with rarity-based styling
  - Shows locked/unlocked state
  - Progress bar for incomplete badges
  - Rarity colors: common (gray), rare (blue), epic (purple), legendary (gold)
  - `BadgesGrid` component for displaying all badges

#### Leaderboard Component

- **`frontend/src/components/leaderboard/Leaderboard.tsx`**
  - Tabbed interface: All Time / Monthly / Weekly
  - Top 3 users highlighted with medals (🥇🥈🥉)
  - Shows rank, level, points, reports, votes, and badges
  - Responsive card layout with gradients for top performers

### Pages

- **`frontend/src/app/profile/rewards/page.tsx`**

  - Rewards overview tab with RewardsProfile component
  - All badges tab with BadgesGrid component
  - Tab navigation for switching views

- **`frontend/src/app/leaderboard/page.tsx`**
  - Full-page leaderboard display
  - Period selection (all-time, monthly, weekly)

### Hooks

- **`frontend/src/lib/hooks/useAuth.ts`**
  - Custom hook for accessing authenticated user data
  - Reads from localStorage (ciis_user)
  - Returns user object and loading state

## 📄 Files Updated

### Issues Pages

- **`frontend/src/app/issues/page.tsx`**

  - Added `VoteButton` to each issue card
  - Updated Issue interface with `voteCount` and `votedBy` fields
  - Vote button appears next to "View Details" button

- **`frontend/src/app/issues/[id]/page.tsx`**
  - Added `VoteButton` in header actions area
  - Added `VoteCount` display near status badges
  - Updates issue state when vote changes
  - Added voting-related fields to Issue interface

## 🎨 Component Features

### VoteButton

```tsx
<VoteButton
  issueId="issue-123"
  initialVoteCount={5}
  initialHasVoted={false}
  size="md"
  showCount={true}
  onVoteChange={(count, hasVoted) => {}}
/>
```

**Features:**

- Thumbs-up icon (filled when voted, outline when not)
- Blue gradient when voted, gray when not voted
- Disabled for unauthenticated users
- Loading state during API calls
- Error messages displayed below button
- Prevents voting on own issues (handled by backend)

### RewardsProfile

```tsx
<RewardsProfile />
```

**Displays:**

- Level badge with gradient background
- Total points with formatted numbers
- Progress bar to next level
- 6 statistics cards: Issues Reported, Issues Resolved, Votes Received, Votes Cast, Helpful Reports, Badges Earned
- Recent badges preview (max 6 shown)

### BadgeCard

```tsx
<BadgeCard
  badge={badgeData}
  earned={true}
  progress={75}
  earnedAt="2024-01-15"
/>
```

**Features:**

- Rarity-based border and glow effects
- Locked icon for unearned badges
- Progress bar with percentage
- Hover scale animation
- Gradient backgrounds matching rarity

### Leaderboard

```tsx
<Leaderboard organizationId="org-123" />
```

**Features:**

- Period tabs with emoji icons
- Medal emojis for top 3 (🥇🥈🥉)
- Gradient backgrounds for top 3 cards
- Displays: rank, name, role, level, points, reports, votes, badges
- Loading skeletons
- Error handling

## 🔌 API Integration

All API calls use the `rewards.ts` service:

```typescript
import {
  voteOnIssue,
  unvoteOnIssue,
  getMyRewards,
  getAllBadges,
  getLeaderboard,
} from "@/lib/api/rewards";

// Vote on issue
const result = await voteOnIssue("issue-id");

// Get user rewards
const rewards = await getMyRewards();

// Get leaderboard
const leaderboard = await getLeaderboard("org-id", "all_time", 100);
```

## 🎯 User Flows

### Voting Flow

1. User views issue in list or detail page
2. Clicks vote button (thumbs up icon)
3. Optimistic UI update (button turns blue)
4. API call to POST `/api/issues/:id/vote`
5. If successful: vote count increases, button stays blue
6. If error: reverts state, shows error message
7. User earns 2 reward points automatically
8. Issue reporter earns 5 reward points

### Viewing Rewards Flow

1. User navigates to `/profile/rewards`
2. Overview tab loads with `getMyRewards()` API call
3. Displays level, points, progress bar, statistics, recent badges
4. User can switch to "All Badges" tab
5. Badges grid loads with `getAllBadges()` API call
6. Shows earned badges (colored) and locked badges (grayed)

### Leaderboard Flow

1. User navigates to `/leaderboard`
2. Default "All Time" tab loads
3. API call to `getLeaderboard(orgId, "all_time")`
4. Displays ranked users with medals for top 3
5. User can switch to Monthly or Weekly tabs
6. Data reloads for selected period

## 🎨 Styling

All components use:

- **Tailwind CSS** for styling
- **Gradient backgrounds** for visual hierarchy
- **Framer Motion** (compatible with existing animations)
- **Dark theme** matching the existing CIIS design
- **Responsive design** (mobile, tablet, desktop)

### Color Scheme

- **Primary**: Blue/Purple gradients
- **Voted state**: Blue (`bg-blue-600`, `hover:bg-blue-700`)
- **Unvoted state**: Gray (`bg-gray-100`, `hover:bg-gray-200`)
- **Common badges**: Gray
- **Rare badges**: Blue
- **Epic badges**: Purple
- **Legendary badges**: Yellow/Orange

## 🔒 Authentication

All components check for authentication:

```typescript
const { user } = useAuth();

if (!user) {
  return <div>Please sign in to view rewards</div>;
}
```

API requests include Bearer token:

```typescript
headers: {
  Authorization: `Bearer ${token}`,
}
```

## 📱 Responsive Design

### Mobile (< 640px)

- Single column layouts
- Stacked buttons
- Badges grid: 1 column
- Leaderboard: Compact stats

### Tablet (640px - 1024px)

- Badges grid: 2 columns
- Stats grid: 2 columns
- Leaderboard: Full layout

### Desktop (> 1024px)

- Badges grid: 3-4 columns
- Stats grid: 3 columns
- Leaderboard: Full layout with all columns

## 🚀 Next Steps

1. **Run Backend Migration**

   ```bash
   cd backend
   npm run migrate:voting-rewards
   npm run seed:badges
   ```

2. **Create Firestore Indexes** (in Firebase Console)

   - votes: `issueId` (Asc) + `userId` (Asc)
   - user_badges: `userId` (Asc) + `badgeId` (Asc)
   - reward_transactions: `userId` (Asc) + `createdAt` (Desc)
   - leaderboard: `organizationId` (Asc) + `period` (Asc) + `rank` (Asc)

3. **Update Firestore Security Rules** (see `docs/VOTING_REWARDS_DATABASE.md`)

4. **Test Frontend**

   ```bash
   cd frontend
   npm run dev
   ```

   - Navigate to issues page and test voting
   - Go to `/profile/rewards` to view rewards
   - Check `/leaderboard` page

5. **Optional Enhancements**
   - Add notifications when user earns badges
   - Add confetti animation on level up
   - Add badge achievement modals
   - Add vote animations (heart burst, etc.)
   - Add user profile pictures to leaderboard
   - Add filtering/sorting to badges page

## 🐛 Troubleshooting

### Vote button not working

- Check browser console for API errors
- Verify token in localStorage: `localStorage.getItem("ciis_token")`
- Ensure backend is running and CORS is configured
- Check if user is authenticated

### Rewards not loading

- Verify API_BASE_URL in rewards.ts
- Check network tab for API response
- Ensure user has organizationId in localStorage
- Run migration script if database fields are missing

### Leaderboard empty

- Run `npm run migrate:voting-rewards` to backfill data
- Check if organizationId matches in frontend and backend
- Verify leaderboard collection exists in Firestore
- Check console for API errors

## 📊 Component Hierarchy

```
App
├── Issues Page (/issues)
│   └── IssueListItem
│       └── VoteButton
│
├── Issue Detail (/issues/[id])
│   ├── VoteButton
│   └── VoteCount
│
├── Profile Rewards (/profile/rewards)
│   ├── RewardsProfile
│   │   └── StatCard (×6)
│   └── BadgesGrid
│       └── BadgeCard (×N)
│
└── Leaderboard (/leaderboard)
    └── Leaderboard
        ├── TabButton (×3)
        └── LeaderboardCard (×N)
```

## 🎉 Completion Checklist

- ✅ API service layer with all endpoints
- ✅ VoteButton component with 3 sizes
- ✅ VoteCount display component
- ✅ RewardsProfile with level progress
- ✅ BadgeCard with rarity styling
- ✅ BadgesGrid component
- ✅ Leaderboard with period tabs
- ✅ Profile rewards page
- ✅ Leaderboard page
- ✅ Updated issues list with voting
- ✅ Updated issue detail with voting
- ✅ useAuth hook
- ✅ TypeScript types for all entities
- ✅ Responsive design
- ✅ Error handling
- ✅ Loading states
- ✅ Dark theme styling

## 📖 Related Documentation

- Backend API: `docs/VOTING_REWARDS_API.md`
- Database Schema: `docs/VOTING_REWARDS_DATABASE.md`
- Implementation Guide: `VOTING_REWARDS_IMPLEMENTATION.md`
