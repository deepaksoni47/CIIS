import { firestore } from "firebase-admin";
import { getFirestore } from "../../config/firebase";
import { getAuth } from "../../config/firebase";
import { User, Issue, UserRole, IssueStatus } from "../../types";

const db = getFirestore();

interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface IssueFilters {
  status?: string;
  category?: string;
  severity?: number;
  buildingId?: string;
  reportedBy?: string;
  assignedTo?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Get admin dashboard overview with key metrics
 */
export async function getDashboardOverview(organizationId: string) {
  // Get user counts
  const usersSnapshot = await db
    .collection("users")
    .where("organizationId", "==", organizationId)
    .get();

  const users = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];

  const userStats = {
    total: users.length,
    active: users.filter((u) => u.isActive).length,
    byRole: {
      admin: users.filter((u) => u.role === UserRole.ADMIN).length,
      facilityManager: users.filter((u) => u.role === UserRole.FACILITY_MANAGER)
        .length,
      staff: users.filter((u) => u.role === UserRole.STAFF).length,
      faculty: users.filter((u) => u.role === UserRole.FACULTY).length,
      student: users.filter((u) => u.role === UserRole.STUDENT).length,
    },
  };

  // Get issue counts
  const issuesSnapshot = await db
    .collection("issues")
    .where("organizationId", "==", organizationId)
    .get();

  const issues = issuesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];

  const issueStats = {
    total: issues.length,
    open: issues.filter((i) => i.status === IssueStatus.OPEN).length,
    inProgress: issues.filter((i) => i.status === IssueStatus.IN_PROGRESS)
      .length,
    resolved: issues.filter((i) => i.status === IssueStatus.RESOLVED).length,
    closed: issues.filter((i) => i.status === IssueStatus.CLOSED).length,
    avgResolutionTime: calculateAvgResolutionTime(issues),
    bySeverity: {
      critical: issues.filter((i) => i.severity >= 8).length,
      high: issues.filter((i) => i.severity >= 6 && i.severity < 8).length,
      medium: issues.filter((i) => i.severity >= 4 && i.severity < 6).length,
      low: issues.filter((i) => i.severity < 4).length,
    },
  };

  // Get recent activity
  const recentIssues = issues
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as any);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as any);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);

  const recentUsers = users
    .sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt as any);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt as any);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 10);

  // Get top contributors
  const topContributors = users
    .filter((u) => u.statistics?.issuesReported > 0)
    .sort(
      (a, b) =>
        (b.statistics?.issuesReported || 0) -
        (a.statistics?.issuesReported || 0)
    )
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      issuesReported: u.statistics?.issuesReported || 0,
      rewardPoints: u.rewardPoints,
    }));

  return {
    userStats,
    issueStats,
    recentIssues: recentIssues.map((i) => ({
      id: i.id,
      title: i.title,
      status: i.status,
      severity: i.severity,
      category: i.category,
      createdAt: i.createdAt,
      reportedBy: i.reportedBy,
    })),
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
    })),
    topContributors,
  };
}

/**
 * Get all users with filters and pagination
 */
export async function getAllUsers(
  organizationId: string,
  filters: UserFilters
) {
  const {
    role,
    isActive,
    search,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  let query = db
    .collection("users")
    .where("organizationId", "==", organizationId);

  if (role) {
    query = query.where("role", "==", role) as any;
  }

  if (isActive !== undefined) {
    query = query.where("isActive", "==", isActive) as any;
  }

  const snapshot = await query.get();
  let users = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as User[];

  // Client-side search filter
  if (search) {
    const searchLower = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  users.sort((a, b) => {
    let aVal: any = a[sortBy as keyof User];
    let bVal: any = b[sortBy as keyof User];

    if (aVal?.toDate) aVal = aVal.toDate();
    if (bVal?.toDate) bVal = bVal.toDate();

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Pagination
  const total = users.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = users.slice(startIndex, endIndex);

  return {
    users: paginatedUsers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user by ID with full details
 */
export async function getUserById(userId: string) {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const user = { id: userDoc.id, ...userDoc.data() } as User;

  // Get user's issues
  const issuesSnapshot = await db
    .collection("issues")
    .where("reportedBy", "==", userId)
    .get();

  const issues = issuesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return {
    ...user,
    issuesReported: issues,
    issuesCount: issues.length,
  };
}

/**
 * Update user details
 */
export async function updateUser(userId: string, updates: Partial<User>) {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  // Remove fields that shouldn't be updated directly
  const { id, createdAt, statistics, ...allowedUpdates } = updates as any;

  const updateData = {
    ...allowedUpdates,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };

  await userRef.update(updateData);

  const updatedDoc = await userRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as User;
}

/**
 * Delete user
 */
export async function deleteUser(userId: string) {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  // Delete user from Firestore
  await userRef.delete();

  // Delete user from Firebase Auth
  try {
    const auth = getAuth();
    await auth.deleteUser(userId);
  } catch (error) {
    console.error("Error deleting user from Firebase Auth:", error);
    // Continue even if auth deletion fails
  }
}

/**
 * Toggle user active status
 */
export async function toggleUserStatus(userId: string) {
  const userRef = db.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const currentStatus = userDoc.data()!.isActive;

  await userRef.update({
    isActive: !currentStatus,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });

  const updatedDoc = await userRef.get();
  return { id: updatedDoc.id, ...updatedDoc.data() } as User;
}

/**
 * Get all issues with admin filters
 */
export async function getAllIssues(
  organizationId: string,
  filters: IssueFilters
) {
  const {
    status,
    category,
    severity,
    buildingId,
    reportedBy,
    assignedTo,
    search,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = filters;

  let query = db
    .collection("issues")
    .where("organizationId", "==", organizationId);

  if (status) {
    query = query.where("status", "==", status) as any;
  }

  if (category) {
    query = query.where("category", "==", category) as any;
  }

  if (buildingId) {
    query = query.where("buildingId", "==", buildingId) as any;
  }

  if (reportedBy) {
    query = query.where("reportedBy", "==", reportedBy) as any;
  }

  if (assignedTo) {
    query = query.where("assignedTo", "==", assignedTo) as any;
  }

  if (startDate) {
    query = query.where(
      "createdAt",
      ">=",
      firestore.Timestamp.fromDate(startDate)
    ) as any;
  }

  if (endDate) {
    query = query.where(
      "createdAt",
      "<=",
      firestore.Timestamp.fromDate(endDate)
    ) as any;
  }

  const snapshot = await query.get();
  let issues = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];

  // Client-side filters
  if (severity !== undefined) {
    issues = issues.filter((i) => i.severity === severity);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    issues = issues.filter(
      (i) =>
        i.title.toLowerCase().includes(searchLower) ||
        i.description.toLowerCase().includes(searchLower)
    );
  }

  // Sort
  issues.sort((a, b) => {
    let aVal: any = a[sortBy as keyof Issue];
    let bVal: any = b[sortBy as keyof Issue];

    if (aVal?.toDate) aVal = aVal.toDate();
    if (bVal?.toDate) bVal = bVal.toDate();

    if (sortOrder === "asc") {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  // Pagination
  const total = issues.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedIssues = issues.slice(startIndex, endIndex);

  // Get reporter names for each issue
  const issuesWithReporter = await Promise.all(
    paginatedIssues.map(async (issue) => {
      try {
        const reporterDoc = await db
          .collection("users")
          .doc(issue.reportedBy)
          .get();
        const reporterName = reporterDoc.exists
          ? reporterDoc.data()!.name
          : "Unknown";
        return {
          ...issue,
          reporterName,
        };
      } catch (error) {
        return {
          ...issue,
          reporterName: "Unknown",
        };
      }
    })
  );

  return {
    issues: issuesWithReporter,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get user statistics and activity
 */
export async function getUserStatistics(userId: string) {
  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) {
    throw new Error("User not found");
  }

  const user = userDoc.data() as User;

  // Get user's issues
  const issuesSnapshot = await db
    .collection("issues")
    .where("reportedBy", "==", userId)
    .get();

  const issues = issuesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];

  // Calculate statistics
  const issuesByStatus = {
    open: issues.filter((i) => i.status === IssueStatus.OPEN).length,
    inProgress: issues.filter((i) => i.status === IssueStatus.IN_PROGRESS)
      .length,
    resolved: issues.filter((i) => i.status === IssueStatus.RESOLVED).length,
    closed: issues.filter((i) => i.status === IssueStatus.CLOSED).length,
  };

  const issuesByCategory = issues.reduce(
    (acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const avgSeverity =
    issues.length > 0
      ? issues.reduce((sum, i) => sum + i.severity, 0) / issues.length
      : 0;

  // Get voting activity
  const votingSnapshot = await db
    .collection("issue_votes")
    .where("userId", "==", userId)
    .get();

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      rewardPoints: user.rewardPoints,
      level: user.level,
      badges: user.badges,
    },
    statistics: user.statistics,
    issueStatistics: {
      total: issues.length,
      byStatus: issuesByStatus,
      byCategory: issuesByCategory,
      avgSeverity: Math.round(avgSeverity * 10) / 10,
    },
    votingActivity: {
      totalVotes: votingSnapshot.size,
    },
  };
}

/**
 * Get system analytics
 */
export async function getSystemAnalytics(
  organizationId: string,
  startDate?: Date,
  endDate?: Date
) {
  let issuesQuery = db
    .collection("issues")
    .where("organizationId", "==", organizationId);

  if (startDate) {
    issuesQuery = issuesQuery.where(
      "createdAt",
      ">=",
      firestore.Timestamp.fromDate(startDate)
    ) as any;
  }

  if (endDate) {
    issuesQuery = issuesQuery.where(
      "createdAt",
      "<=",
      firestore.Timestamp.fromDate(endDate)
    ) as any;
  }

  const issuesSnapshot = await issuesQuery.get();
  const issues = issuesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];

  // Issues trend over time
  const issuesTrend = calculateTrend(issues, "createdAt");

  // Resolution trend
  const resolvedIssues = issues.filter(
    (i) => i.status === IssueStatus.RESOLVED
  );
  const resolutionTrend = calculateTrend(resolvedIssues, "updatedAt");

  // Category distribution
  const categoryDistribution = issues.reduce(
    (acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Building distribution
  const buildingDistribution = issues.reduce(
    (acc, issue) => {
      acc[issue.buildingId] = (acc[issue.buildingId] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Severity distribution
  const severityDistribution = {
    critical: issues.filter((i) => i.severity >= 8).length,
    high: issues.filter((i) => i.severity >= 6 && i.severity < 8).length,
    medium: issues.filter((i) => i.severity >= 4 && i.severity < 6).length,
    low: issues.filter((i) => i.severity < 4).length,
  };

  return {
    issuesTrend,
    resolutionTrend,
    categoryDistribution,
    buildingDistribution,
    severityDistribution,
    avgResolutionTime: calculateAvgResolutionTime(resolvedIssues),
    totalIssues: issues.length,
    resolvedIssues: resolvedIssues.length,
    resolutionRate:
      issues.length > 0 ? (resolvedIssues.length / issues.length) * 100 : 0,
  };
}

/**
 * Get user activity logs
 */
export async function getUserActivity(
  userId: string,
  options: { page?: number; limit?: number }
) {
  const { page = 1, limit = 50 } = options;

  // Get user's issues
  const issuesSnapshot = await db
    .collection("issues")
    .where("reportedBy", "==", userId)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();

  const issues = issuesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    activityType: "issue_reported",
  }));

  // Get user's votes
  const votesSnapshot = await db
    .collection("issue_votes")
    .where("userId", "==", userId)
    .orderBy("votedAt", "desc")
    .limit(limit)
    .get();

  const votes = votesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    activityType: "vote_cast",
  }));

  // Combine and sort by timestamp
  const activity = [...issues, ...votes].sort((a: any, b: any) => {
    const dateA =
      a.createdAt?.toDate?.() || a.votedAt?.toDate?.() || new Date(0);
    const dateB =
      b.createdAt?.toDate?.() || b.votedAt?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const total = activity.length;
  const startIndex = (page - 1) * limit;
  const paginatedActivity = activity.slice(startIndex, startIndex + limit);

  return {
    activity: paginatedActivity,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(
  userIds: string[],
  updates: Partial<User>
) {
  const { id, createdAt, statistics, ...allowedUpdates } = updates as any;

  const batch = db.batch();
  let successCount = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  for (const userId of userIds) {
    try {
      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        errors.push({ userId, error: "User not found" });
        continue;
      }

      batch.update(userRef, {
        ...allowedUpdates,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      successCount++;
    } catch (error) {
      errors.push({
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  await batch.commit();

  return {
    successCount,
    failureCount: errors.length,
    errors,
  };
}

/**
 * Export users data
 */
export async function exportUsers(
  organizationId: string,
  format: "json" | "csv"
) {
  const snapshot = await db
    .collection("users")
    .where("organizationId", "==", organizationId)
    .get();

  const users = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      isActive: data.isActive,
      rewardPoints: data.rewardPoints,
      level: data.level,
      issuesReported: data.statistics?.issuesReported || 0,
      issuesResolved: data.statistics?.issuesResolved || 0,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || "",
    };
  });

  if (format === "csv") {
    return convertToCSV(users);
  }

  return JSON.stringify(users, null, 2);
}

/**
 * Export issues data
 */
export async function exportIssues(
  organizationId: string,
  format: "json" | "csv",
  filters?: { status?: string; category?: string }
) {
  let query = db
    .collection("issues")
    .where("organizationId", "==", organizationId);

  if (filters?.status) {
    query = query.where("status", "==", filters.status) as any;
  }

  if (filters?.category) {
    query = query.where("category", "==", filters.category) as any;
  }

  const snapshot = await query.get();

  const issues = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      severity: data.severity,
      priority: data.priority,
      buildingId: data.buildingId,
      reportedBy: data.reportedBy,
      assignedTo: data.assignedTo || "",
      voteCount: data.voteCount || 0,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || "",
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || "",
    };
  });

  if (format === "csv") {
    return convertToCSV(issues);
  }

  return JSON.stringify(issues, null, 2);
}

// Helper functions

function calculateAvgResolutionTime(issues: Issue[]): number {
  const resolvedIssues = issues.filter(
    (i) => i.status === IssueStatus.RESOLVED && i.updatedAt && i.createdAt
  );

  if (resolvedIssues.length === 0) return 0;

  const totalTime = resolvedIssues.reduce((sum, issue) => {
    const created =
      issue.createdAt?.toDate?.() || new Date(issue.createdAt as any);
    const resolved =
      issue.updatedAt?.toDate?.() || new Date(issue.updatedAt as any);
    return sum + (resolved.getTime() - created.getTime());
  }, 0);

  // Return average in hours
  return (
    Math.round((totalTime / resolvedIssues.length / (1000 * 60 * 60)) * 10) / 10
  );
}

function calculateTrend(
  items: any[],
  dateField: string
): Array<{ date: string; count: number }> {
  const trendMap: Record<string, number> = {};

  items.forEach((item) => {
    const date = item[dateField]?.toDate?.() || new Date(item[dateField]);
    const dateStr = date.toISOString().split("T")[0];
    trendMap[dateStr] = (trendMap[dateStr] || 0) + 1;
  });

  return Object.entries(trendMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(",")];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      // Escape commas and quotes
      const escaped = ("" + value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}
