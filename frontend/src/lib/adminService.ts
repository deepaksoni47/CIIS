import api from "@/lib/api";

export interface AdminDashboardOverview {
  userStats: {
    total: number;
    active: number;
    byRole: {
      admin: number;
      facilityManager: number;
      staff: number;
      faculty: number;
      student: number;
    };
  };
  issueStats: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
    avgResolutionTime: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  recentIssues: any[];
  recentUsers: any[];
  topContributors: any[];
}

export interface PaginatedUsers {
  users: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedIssues {
  issues: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface SystemAnalytics {
  issuesTrend: Array<{ date: string; count: number }>;
  resolutionTrend: Array<{ date: string; count: number }>;
  categoryDistribution: Record<string, number>;
  buildingDistribution: Record<string, number>;
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  avgResolutionTime: number;
  totalIssues: number;
  resolvedIssues: number;
  resolutionRate: number;
}

/**
 * Get admin dashboard overview
 */
export async function getDashboardOverview(): Promise<AdminDashboardOverview> {
  const response = await api.get("/api/admin/dashboard");
  return response.data.data;
}

/**
 * Get all users with filters
 */
export async function getAllUsers(params?: {
  role?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedUsers> {
  const response = await api.get("/api/admin/users", { params });
  return response.data.data;
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const response = await api.get(`/api/admin/users/${userId}`);
  return response.data.data;
}

/**
 * Update user
 */
export async function updateUser(userId: string, updates: any) {
  const response = await api.patch(`/api/admin/users/${userId}`, updates);
  return response.data.data;
}

/**
 * Delete user
 */
export async function deleteUser(userId: string) {
  const response = await api.delete(`/api/admin/users/${userId}`);
  return response.data;
}

/**
 * Toggle user status
 */
export async function toggleUserStatus(userId: string) {
  const response = await api.patch(`/api/admin/users/${userId}/toggle-status`);
  return response.data.data;
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  const response = await api.get(`/api/admin/users/${userId}/stats`);
  return response.data.data;
}

/**
 * Get user activity
 */
export async function getUserActivity(
  userId: string,
  params?: { page?: number; limit?: number }
) {
  const response = await api.get(`/api/admin/users/${userId}/activity`, {
    params,
  });
  return response.data.data;
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(userIds: string[], updates: any) {
  const response = await api.patch("/api/admin/users/bulk", {
    userIds,
    updates,
  });
  return response.data.data;
}

/**
 * Export users
 */
export async function exportUsers(format: "json" | "csv" = "json") {
  const response = await api.get("/api/admin/users/export", {
    params: { format },
    responseType: "blob",
  });
  return response.data;
}

/**
 * Get all issues with filters
 */
export async function getAllIssues(params?: {
  status?: string;
  category?: string;
  severity?: number;
  buildingId?: string;
  reportedBy?: string;
  assignedTo?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<PaginatedIssues> {
  const response = await api.get("/api/admin/issues", { params });
  return response.data.data;
}

/**
 * Export issues
 */
export async function exportIssues(
  format: "json" | "csv" = "json",
  filters?: any
) {
  const response = await api.get("/api/admin/issues/export", {
    params: { format, ...filters },
    responseType: "blob",
  });
  return response.data;
}

/**
 * Get system analytics
 */
export async function getSystemAnalytics(params?: {
  startDate?: string;
  endDate?: string;
}): Promise<SystemAnalytics> {
  const response = await api.get("/api/admin/analytics", { params });
  return response.data.data;
}

export const adminService = {
  getDashboardOverview,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUserStats,
  getUserActivity,
  bulkUpdateUsers,
  exportUsers,
  getAllIssues,
  exportIssues,
  getSystemAnalytics,
};
