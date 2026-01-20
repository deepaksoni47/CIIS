/**
 * API Service for Voting & Rewards System
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL as string;

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("campuscare_token");
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }

  return data;
}

// ==================== VOTING API ====================

/**
 * Cast a vote on an issue
 */
export async function voteOnIssue(issueId: string) {
  return apiRequest<{
    success: boolean;
    message: string;
    data: { voteCount: number; voted: boolean };
  }>(`/api/issues/${issueId}/vote`, {
    method: "POST",
  });
}

/**
 * Remove vote from an issue
 */
export async function unvoteOnIssue(issueId: string) {
  return apiRequest<{
    success: boolean;
    message: string;
    data: { voteCount: number; voted: boolean };
  }>(`/api/issues/${issueId}/vote`, {
    method: "DELETE",
  });
}

/**
 * Get votes for an issue
 */
export async function getIssueVotes(issueId: string) {
  return apiRequest<{
    success: boolean;
    data: {
      voteCount: number;
      voters: Array<{ userId: string; votedAt: string | number }>;
      hasVoted: boolean;
    };
  }>(`/api/issues/${issueId}/votes`);
}

/**
 * Check if user has voted on an issue
 */
export async function checkUserVote(issueId: string) {
  return apiRequest<{
    success: boolean;
    data: { hasVoted: boolean };
  }>(`/api/issues/${issueId}/vote/check`);
}

/**
 * Get user's voted issues
 */
export async function getUserVotes() {
  return apiRequest<{
    success: boolean;
    data: { votedIssueIds: string[]; count: number };
  }>(`/api/users/me/votes`);
}

// ==================== REWARDS API ====================

export interface UserRewards {
  rewardPoints: number;
  level: number;
  badges: Badge[];
  statistics: {
    issuesReported: number;
    issuesResolved: number;
    votesReceived: number;
    votesCast: number;
    helpfulReports: number;
  };
  nextLevelPoints: number;
  levelProgress: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "reporter" | "voter" | "resolver" | "community" | "special";
  criteria: {
    type: string;
    threshold: number;
    description: string;
  };
  pointsAwarded: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  isActive: boolean;
}

export interface RewardTransaction {
  id: string;
  userId: string;
  organizationId: string;
  type: string;
  points: number;
  relatedEntityId?: string;
  relatedEntityType?: string;
  description: string;
  createdAt: string | number;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  organizationId: string;
  userName: string;
  userRole: string;
  rewardPoints: number;
  level: number;
  rank: number;
  issuesReported: number;
  votesReceived: number;
  badges: string[];
  period: "all_time" | "monthly" | "weekly";
  updatedAt: string | number;
}

/**
 * Get user rewards profile
 */
export async function getUserRewards(userId: string) {
  return apiRequest<{
    success: boolean;
    data: UserRewards;
  }>(`/api/users/${userId}/rewards`);
}

/**
 * Get current user's rewards
 */
export async function getMyRewards() {
  return apiRequest<{
    success: boolean;
    data: UserRewards;
  }>(`/api/users/me/rewards`);
}

/**
 * Get user transaction history
 */
export async function getUserTransactions(userId: string, limit: number = 50) {
  return apiRequest<{
    success: boolean;
    data: { transactions: RewardTransaction[]; count: number };
  }>(`/api/users/${userId}/transactions?limit=${limit}`);
}

// ==================== BADGES API ====================

/**
 * Get all available badges
 */
export async function getAllBadges() {
  return apiRequest<{
    success: boolean;
    data: { badges: Badge[]; count: number };
  }>(`/api/badges`);
}

/**
 * Get badge details
 */
export async function getBadge(
  badgeId: string,
  includeAchievers: boolean = false,
) {
  return apiRequest<{
    success: boolean;
    data: {
      badge: Badge;
      achievers?: Array<{
        userId: string;
        userName: string;
        earnedAt: string | number;
      }>;
      achieverCount: number;
    };
  }>(`/api/badges/${badgeId}?includeAchievers=${includeAchievers}`);
}

// ==================== LEADERBOARD API ====================

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  organizationId: string,
  period: "all_time" | "monthly" | "weekly" = "all_time",
  limit: number = 100,
) {
  return apiRequest<{
    success: boolean;
    data: {
      leaderboard: LeaderboardEntry[];
      period: string;
      count: number;
    };
  }>(
    `/api/leaderboard?organizationId=${organizationId}&period=${period}&limit=${limit}`,
  );
}

// ==================== ADMIN API ====================

/**
 * Award points to user (admin only)
 */
export async function awardPoints(
  userId: string,
  points: number,
  description: string,
) {
  return apiRequest<{
    success: boolean;
    message: string;
  }>(`/api/admin/users/${userId}/award-points`, {
    method: "POST",
    body: JSON.stringify({ points, description }),
  });
}

/**
 * Check and award badges (admin only)
 */
export async function checkBadges(userId: string) {
  return apiRequest<{
    success: boolean;
    message: string;
    data: { newBadges: Badge[]; count: number };
  }>(`/api/admin/users/${userId}/check-badges`, {
    method: "POST",
  });
}
