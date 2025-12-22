# Frontend Quick Start Guide - Voting & Rewards

## 🚀 Getting Started

### Prerequisites

1. Backend server running with voting/rewards API endpoints
2. Database migration completed (`npm run migrate:voting-rewards`)
3. Badges seeded (`npm run seed:badges`)
4. Firestore indexes created

### Installation

```bash
cd frontend
npm install  # If dependencies need updating
npm run dev
```

The frontend should start at `http://localhost:3000` (or your configured port)

## 🧪 Testing Features

### 1. Test Voting on Issues

**Issue List Page** (`/issues`)

1. Navigate to the issues page
2. Each issue card now has a vote button (thumbs up icon)
3. Click the vote button:
   - ✅ Button should turn blue and vote count should increase
   - ✅ You should earn 2 reward points
   - ✅ Issue reporter should earn 5 reward points
4. Click again to unvote:
   - ✅ Button should turn gray and vote count should decrease

**Issue Detail Page** (`/issues/[id]`)

1. Click "View Details" on any issue
2. See vote count displayed near status badges
3. Vote button appears in the header actions area
4. Vote/unvote and see real-time updates

### 2. Test Rewards Profile

**Navigate to** `/profile/rewards`

**Overview Tab**

1. See your level displayed with gradient background
2. View total reward points
3. Check progress bar to next level
4. See 6 statistics cards:
   - 📝 Issues Reported
   - ✅ Issues Resolved
   - 👍 Votes Received
   - 🗳️ Votes Cast
   - ⭐ Helpful Reports
   - 🎖️ Badges Earned
5. View recent badges (first 6 shown)

**All Badges Tab**

1. Click "🎖️ All Badges" tab
2. See grid of all available badges
3. Earned badges: colored with glow effects
4. Locked badges: grayscale with lock icon
5. Progress bars on incomplete badges

### 3. Test Leaderboard

**Navigate to** `/leaderboard`

1. See "All Time" tab selected by default
2. Top 3 users highlighted with medals (🥇🥈🥉)
3. Each entry shows:

   - Rank or medal
   - User name and role
   - Level and points
   - Reports count
   - Votes received
   - Badges count

4. Switch between tabs:

   - 🏆 All Time
   - 📅 This Month
   - 📊 This Week

5. Data should reload for each period

## 🎯 Test User Flows

### Complete Voting Flow

1. Go to `/issues`
2. Find an issue you didn't create
3. Click the vote button
4. ✅ Vote count increases
5. ✅ Button turns blue
6. Go to `/profile/rewards`
7. ✅ Your "Votes Cast" stat increased
8. ✅ You earned 2 points

### Earn a Badge

1. Create multiple issues to increase "Issues Reported" stat
2. Go to `/profile/rewards` → All Badges tab
3. Check progress on reporter badges:
   - 🌟 First Report (1 issue)
   - 📝 Active Reporter (5 issues)
   - 📊 Dedicated Reporter (10 issues)
4. When threshold met, badge unlocks automatically

### Climb the Leaderboard

1. Participate actively:
   - Report issues (+10 points each)
   - Vote on others' issues (+2 points per vote)
   - Get votes on your issues (+5 points per vote)
2. Go to `/leaderboard`
3. See your ranking improve
4. Check your badge count increases

## 🔍 Visual Testing Checklist

### Vote Button

- [ ] Thumbs up icon visible
- [ ] Vote count displays correctly
- [ ] Gray background when not voted
- [ ] Blue background when voted
- [ ] Hover effect works
- [ ] Loading spinner shows during API call
- [ ] Disabled state for unauthenticated users
- [ ] Error message displays if vote fails

### Rewards Profile

- [ ] Level gradient card displays correctly
- [ ] Points formatted with commas
- [ ] Progress bar animates smoothly
- [ ] All 6 stat cards visible and colored
- [ ] Badge icons render properly
- [ ] Responsive on mobile

### Badge Cards

- [ ] Common badges: gray border
- [ ] Rare badges: blue border
- [ ] Epic badges: purple border
- [ ] Legendary badges: gold border
- [ ] Locked icon on unearned badges
- [ ] Progress bar shows percentage
- [ ] Hover scale animation works

### Leaderboard

- [ ] Top 3 have gradient backgrounds
- [ ] Medals display for positions 1-3
- [ ] All stats visible and aligned
- [ ] Tab switching works smoothly
- [ ] Loading skeletons appear
- [ ] Responsive on mobile

## 🐛 Common Issues & Fixes

### Vote button not appearing

**Problem:** Import error or component not found  
**Fix:**

```bash
# Make sure files exist
ls frontend/src/components/voting/VoteButton.tsx
ls frontend/src/lib/api/rewards.ts
```

### API calls failing

**Problem:** Backend not running or wrong API_BASE_URL  
**Fix:**

1. Start backend: `cd backend && npm run dev`
2. Check `frontend/src/lib/api/rewards.ts` line 9:
   ```typescript
   const API_BASE_URL =
     process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
   ```
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
   ```

### Rewards not loading

**Problem:** Database migration not run  
**Fix:**

```bash
cd backend
npm run migrate:voting-rewards
npm run seed:badges
```

### Authentication errors

**Problem:** Token expired or missing  
**Fix:**

1. Log out and log back in
2. Check localStorage:
   ```javascript
   localStorage.getItem("ciis_token");
   localStorage.getItem("ciis_user");
   ```
3. Refresh token with Firebase Auth

### Badges not displaying

**Problem:** Badge images/icons not rendering  
**Fix:**

- Badges use emoji icons by default (🏆, 📝, ⭐)
- Check badge seed script ran successfully
- Verify badges collection in Firestore has 23 documents

## 📊 Test Data Setup

### Create Test Issues

```bash
# Via frontend
1. Go to /issues/new
2. Create 10 test issues
3. Note the issue IDs
```

### Create Test Votes

```bash
# Via API or frontend
1. Create second test user
2. Vote on first user's issues
3. First user should receive vote points
```

### Award Test Badges

```bash
# Via admin endpoint
curl -X POST http://localhost:3001/api/admin/users/{userId}/check-badges \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🎨 Responsive Testing

### Mobile (iPhone SE, 375px)

- [ ] Vote buttons are tappable
- [ ] Stats cards stack vertically
- [ ] Badges display 1 column
- [ ] Leaderboard cards readable

### Tablet (iPad, 768px)

- [ ] Badges display 2 columns
- [ ] Stats cards display 2 columns
- [ ] Leaderboard full layout

### Desktop (1920px)

- [ ] Badges display 4 columns
- [ ] Stats cards display 3 columns
- [ ] All content centered with max-width

## ✅ Acceptance Criteria

### Voting

- [x] Users can vote on issues
- [x] Users can unvote
- [x] Vote count updates in real-time
- [x] Cannot vote on own issues
- [x] Cannot vote without authentication
- [x] Voters earn 2 points
- [x] Reporters earn 5 points per vote

### Rewards

- [x] Users can view their level and points
- [x] Progress bar shows advancement
- [x] All statistics display correctly
- [x] Badges earned automatically
- [x] Badge progress tracked

### Leaderboard

- [x] Rankings display correctly
- [x] Top 3 highlighted
- [x] Period filtering works
- [x] Data updates on tab change

### UI/UX

- [x] Components are responsive
- [x] Loading states show
- [x] Error messages display
- [x] Animations smooth
- [x] Accessible (keyboard navigation)

## 🚀 Next Steps After Testing

1. **Run E2E Tests**

   - Set up Playwright or Cypress
   - Test complete user journeys
   - Test edge cases

2. **Performance Optimization**

   - Add React Query for caching
   - Implement optimistic updates
   - Lazy load badge images

3. **Enhanced Features**

   - Real-time updates via WebSockets
   - Push notifications for badges
   - Confetti animation on level up
   - Social sharing of achievements

4. **Analytics**
   - Track vote engagement
   - Monitor badge completion rates
   - Analyze leaderboard activity

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check network tab for API failures
3. Verify backend logs
4. Check Firestore rules
5. Review API documentation: `docs/VOTING_REWARDS_API.md`
