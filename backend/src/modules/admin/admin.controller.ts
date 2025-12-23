import { Request, Response } from "express";
import * as adminService from "./admin.service";
import { UserRole } from "../../types";

/**
 * Get admin dashboard overview
 * GET /api/admin/dashboard
 */
export async function getDashboardOverview(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;

    if (!organizationId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Organization ID is required",
      });
    }

    const overview = await adminService.getDashboardOverview(organizationId);

    res.json({
      success: true,
      data: overview,
    });
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({
      error: "Server error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard overview",
    });
  }
}

/**
 * Get all users with filters and pagination
 * GET /api/admin/users
 */
export async function getAllUsers(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;

    if (!organizationId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Organization ID is required",
      });
    }

    const {
      role,
      isActive,
      search,
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const result = await adminService.getAllUsers(organizationId, {
      role: role as UserRole,
      isActive:
        isActive === "true" ? true : isActive === "false" ? false : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      error: "Server error",
      message: error instanceof Error ? error.message : "Failed to fetch users",
    });
  }
}

/**
 * Get user details by ID
 * GET /api/admin/users/:userId
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const user = await adminService.getUserById(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res
      .status(
        error instanceof Error && error.message === "User not found" ? 404 : 500
      )
      .json({
        error:
          error instanceof Error && error.message === "User not found"
            ? "Not found"
            : "Server error",
        message:
          error instanceof Error ? error.message : "Failed to fetch user",
      });
  }
}

/**
 * Update user details
 * PATCH /api/admin/users/:userId
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const updatedUser = await adminService.updateUser(userId, updates);

    res.json({
      success: true,
      data: updatedUser,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res
      .status(
        error instanceof Error && error.message === "User not found" ? 404 : 500
      )
      .json({
        error:
          error instanceof Error && error.message === "User not found"
            ? "Not found"
            : "Server error",
        message:
          error instanceof Error ? error.message : "Failed to update user",
      });
  }
}

/**
 * Delete user
 * DELETE /api/admin/users/:userId
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { uid: adminId } = req.user!;

    if (userId === adminId) {
      return res.status(400).json({
        error: "Invalid operation",
        message: "You cannot delete your own account",
      });
    }

    await adminService.deleteUser(userId);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res
      .status(
        error instanceof Error && error.message === "User not found" ? 404 : 500
      )
      .json({
        error:
          error instanceof Error && error.message === "User not found"
            ? "Not found"
            : "Server error",
        message:
          error instanceof Error ? error.message : "Failed to delete user",
      });
  }
}

/**
 * Toggle user active status
 * PATCH /api/admin/users/:userId/toggle-status
 */
export async function toggleUserStatus(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { uid: adminId } = req.user!;

    if (userId === adminId) {
      return res.status(400).json({
        error: "Invalid operation",
        message: "You cannot deactivate your own account",
      });
    }

    const updatedUser = await adminService.toggleUserStatus(userId);

    res.json({
      success: true,
      data: updatedUser,
      message: `User ${updatedUser.isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res
      .status(
        error instanceof Error && error.message === "User not found" ? 404 : 500
      )
      .json({
        error:
          error instanceof Error && error.message === "User not found"
            ? "Not found"
            : "Server error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to toggle user status",
      });
  }
}

/**
 * Get all issues with admin filters
 * GET /api/admin/issues
 */
export async function getAllIssues(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;

    if (!organizationId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Organization ID is required",
      });
    }

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
      page = "1",
      limit = "20",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const result = await adminService.getAllIssues(organizationId, {
      status: status as string,
      category: category as string,
      severity: severity ? parseInt(severity as string) : undefined,
      buildingId: buildingId as string,
      reportedBy: reportedBy as string,
      assignedTo: assignedTo as string,
      search: search as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as "asc" | "desc",
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({
      error: "Server error",
      message:
        error instanceof Error ? error.message : "Failed to fetch issues",
    });
  }
}

/**
 * Get user statistics
 * GET /api/admin/users/:userId/stats
 */
export async function getUserStats(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    const stats = await adminService.getUserStatistics(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res
      .status(
        error instanceof Error && error.message === "User not found" ? 404 : 500
      )
      .json({
        error:
          error instanceof Error && error.message === "User not found"
            ? "Not found"
            : "Server error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch user statistics",
      });
  }
}

/**
 * Get system analytics
 * GET /api/admin/analytics
 */
export async function getSystemAnalytics(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;

    if (!organizationId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Organization ID is required",
      });
    }

    const { startDate, endDate } = req.query;

    const analytics = await adminService.getSystemAnalytics(
      organizationId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error("Error fetching system analytics:", error);
    res.status(500).json({
      error: "Server error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch system analytics",
    });
  }
}

/**
 * Get user activity logs
 * GET /api/admin/users/:userId/activity
 */
export async function getUserActivity(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { page = "1", limit = "50" } = req.query;

    const activity = await adminService.getUserActivity(userId, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({
      error: "Server error",
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch user activity",
    });
  }
}

/**
 * Bulk update users
 * PATCH /api/admin/users/bulk
 */
export async function bulkUpdateUsers(req: Request, res: Response) {
  try {
    const { userIds, updates } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: "Invalid parameters",
        message: "userIds array is required",
      });
    }

    const result = await adminService.bulkUpdateUsers(userIds, updates);

    res.json({
      success: true,
      data: result,
      message: `${result.successCount} users updated successfully`,
    });
  } catch (error) {
    console.error("Error bulk updating users:", error);
    res.status(500).json({
      error: "Server error",
      message:
        error instanceof Error ? error.message : "Failed to bulk update users",
    });
  }
}

/**
 * Export users data
 * GET /api/admin/users/export
 */
export async function exportUsers(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;

    if (!organizationId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Organization ID is required",
      });
    }

    const { format = "json" } = req.query;

    const data = await adminService.exportUsers(
      organizationId,
      format as "json" | "csv"
    );

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=users_${Date.now()}.csv`
      );
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=users_${Date.now()}.json`
      );
    }

    res.send(data);
  } catch (error) {
    console.error("Error exporting users:", error);
    res.status(500).json({
      error: "Server error",
      message:
        error instanceof Error ? error.message : "Failed to export users",
    });
  }
}

/**
 * Export issues data
 * GET /api/admin/issues/export
 */
export async function exportIssues(req: Request, res: Response) {
  try {
    const { organizationId } = req.user!;

    if (!organizationId) {
      return res.status(400).json({
        error: "Bad request",
        message: "Organization ID is required",
      });
    }

    const { format = "json", status, category } = req.query;

    const data = await adminService.exportIssues(
      organizationId,
      format as "json" | "csv",
      {
        status: status as string,
        category: category as string,
      }
    );

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=issues_${Date.now()}.csv`
      );
    } else {
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=issues_${Date.now()}.json`
      );
    }

    res.send(data);
  } catch (error) {
    console.error("Error exporting issues:", error);
    res.status(500).json({
      error: "Server error",
      message:
        error instanceof Error ? error.message : "Failed to export issues",
    });
  }
}
