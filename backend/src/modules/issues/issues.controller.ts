import { Request, Response } from "express";
import * as issuesService from "./issues.service";
import {
  IssueCategory,
  IssueStatus,
  IssuePriority,
  UserRole,
} from "../../types";
import { firestore } from "firebase-admin";

/**
 * Create a new issue
 * POST /api/issues
 */
export async function createIssue(req: Request, res: Response) {
  try {
    const userId = req.userData?.id || req.user?.uid;
    const userRole = req.userData?.role;

    if (!userId || !userRole) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated or missing role information",
      });
    }

    const {
      organizationId,
      buildingId,
      departmentId,
      roomId,
      title,
      description,
      category,
      latitude,
      longitude,
      submissionType,
      voiceTranscript,
      voiceAudioUrl,
      images,
      aiImageAnalysis,
    } = req.body;

    // Validation
    if (!organizationId || !buildingId || !title || !description) {
      return res.status(400).json({
        error: "Missing parameters",
        message:
          "organizationId, buildingId, title, and description are required",
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "latitude and longitude are required",
      });
    }

    // Create GeoPoint
    const location = new firestore.GeoPoint(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    const issueData = {
      organizationId,
      buildingId,
      departmentId,
      roomId,
      title,
      description,
      category: category || IssueCategory.OTHER,
      location,
      submissionType: submissionType || "text",
      voiceTranscript,
      voiceAudioUrl,
      images: images || [],
      aiImageAnalysis,
    };

    const issue = await issuesService.createIssue(
      issueData,
      userId,
      userRole as UserRole
    );

    res.status(201).json({
      success: true,
      data: issue,
      message: "Issue created successfully",
    });
  } catch (error: unknown) {
    console.error("Create issue error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create issue";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Get issue by ID
 * GET /api/issues/:id
 */
export async function getIssue(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const issue = await issuesService.getIssueById(id);

    if (!issue) {
      return res.status(404).json({
        error: "Not found",
        message: "Issue not found",
      });
    }

    // TODO: Check if user has permission to view this issue

    res.json({
      success: true,
      data: issue,
    });
  } catch (error: unknown) {
    console.error("Get issue error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch issue";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Get all issues with filters
 * GET /api/issues
 */
export async function getIssues(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;
    // const userRole = req.userData?.role; // Commented out - currently not used

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const {
      organizationId,
      buildingId,
      departmentId,
      roomId,
      category,
      status,
      priority,
      reportedBy,
      assignedTo,
      startDate,
      endDate,
      limit,
      offset,
    } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const filters: any = {
      organizationId: organizationId as string,
    };

    if (buildingId) filters.buildingId = buildingId as string;
    if (departmentId) filters.departmentId = departmentId as string;
    if (roomId) filters.roomId = roomId as string;
    if (category) filters.category = category as IssueCategory;
    if (status) filters.status = status as IssueStatus;
    if (priority) filters.priority = priority as IssuePriority;
    if (reportedBy) filters.reportedBy = reportedBy as string;
    if (assignedTo) filters.assignedTo = assignedTo as string;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    // If user is a student, only show their own issues
    // Temporarily disabled for Priority List view - students can see all issues
    // if (userRole === UserRole.STUDENT) {
    //   filters.reportedBy = userId;
    // }

    const result = await issuesService.getIssues(filters);

    res.json({
      success: true,
      data: result.issues,
      pagination: {
        total: result.total,
        limit: filters.limit || result.total,
        offset: filters.offset || 0,
      },
    });
  } catch (error: unknown) {
    console.error("Get issues error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch issues";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Update issue
 * PATCH /api/issues/:id
 */
export async function updateIssue(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.createdAt;
    delete updates.reportedBy;
    delete updates.organizationId;

    const issue = await issuesService.updateIssue(id, updates, userId);

    res.json({
      success: true,
      data: issue,
      message: "Issue updated successfully",
    });
  } catch (error: unknown) {
    console.error("Update issue error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update issue";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Resolve issue
 * PATCH /api/issues/:id/resolve
 */
export async function resolveIssue(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    // Only staff, facility managers and admins can resolve issues
    if (
      userRole !== UserRole.STAFF &&
      userRole !== UserRole.FACILITY_MANAGER &&
      userRole !== UserRole.ADMIN
    ) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to resolve issues",
      });
    }

    const { id } = req.params;
    const { resolutionComment, actualCost, actualDuration } = req.body;

    const issue = await issuesService.resolveIssue(
      id,
      userId,
      resolutionComment,
      actualCost,
      actualDuration
    );

    res.json({
      success: true,
      data: issue,
      message: "Issue resolved successfully",
    });
  } catch (error: unknown) {
    console.error("Resolve issue error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to resolve issue";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Assign issue
 * PATCH /api/issues/:id/assign
 */
export async function assignIssue(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    // Only facility managers and admins can assign issues
    if (userRole !== UserRole.FACILITY_MANAGER && userRole !== UserRole.ADMIN) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You don't have permission to assign issues",
      });
    }

    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "assignedTo is required",
      });
    }

    const issue = await issuesService.assignIssue(id, assignedTo, userId);

    res.json({
      success: true,
      data: issue,
      message: "Issue assigned successfully",
    });
  } catch (error: unknown) {
    console.error("Assign issue error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to assign issue";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Delete issue
 * DELETE /api/issues/:id
 */
export async function deleteIssue(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const { id } = req.params;

    // Check permissions:
    // - Admins and Facility Managers can delete any issue
    // - Students, Faculty, Staff can only delete their own issues
    const isAdmin = userRole === UserRole.ADMIN;
    const isFacilityManager = userRole === UserRole.FACILITY_MANAGER;

    if (!isAdmin && !isFacilityManager) {
      // Need to check ownership for non-admin/facility-manager users
      const issue = await issuesService.getIssueById(id);

      if (!issue) {
        return res.status(404).json({
          error: "Not found",
          message: "Issue not found",
        });
      }

      if (issue.reportedBy !== userId) {
        return res.status(403).json({
          error: "Forbidden",
          message: "You can only delete your own issues",
        });
      }
    }

    await issuesService.deleteIssue(id, userId);

    res.json({
      success: true,
      message: "Issue closed successfully",
    });
  } catch (error: unknown) {
    console.error("Delete issue error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to delete issue";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Get issue history
 * GET /api/issues/:id/history
 */
export async function getIssueHistory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const history = await issuesService.getIssueHistory(id);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: unknown) {
    console.error("Get issue history error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch issue history";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Upload issue image
 * POST /api/issues/upload-image
 */
export async function uploadImage(req: Request, res: Response) {
  try {
    const userId = req.userData?.id || req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const { organizationId, issueId } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "organizationId is required",
      });
    }

    const files = req.files as Express.Multer.File[];

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({
        error: "Missing files",
        message: "No images provided",
      });
    }

    const uploadPromises = files.map((file) =>
      issuesService.uploadIssueImage(
        file.buffer,
        `${Date.now()}_${file.originalname.replace(/\s+/g, "_")}`,
        organizationId,
        issueId
      )
    );

    const urls = await Promise.all(uploadPromises);

    res.json({
      success: true,
      data: { urls },
      message: "Images uploaded successfully",
    });
  } catch (error: unknown) {
    console.error("Upload image error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to upload image";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Get nearby issues (heatmap data)
 * GET /api/issues/nearby
 */
export async function getNearbyIssues(req: Request, res: Response) {
  try {
    const { organizationId, latitude, longitude, radius } = req.query;

    if (!organizationId || !latitude || !longitude) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "organizationId, latitude, and longitude are required",
      });
    }

    const radiusKm = radius ? parseFloat(radius as string) : 1.0;

    const issues = await issuesService.getIssuesByProximity(
      organizationId as string,
      parseFloat(latitude as string),
      parseFloat(longitude as string),
      radiusKm
    );

    res.json({
      success: true,
      data: issues,
      metadata: {
        center: { latitude, longitude },
        radius: radiusKm,
        count: issues.length,
      },
    });
  } catch (error: unknown) {
    console.error("Get nearby issues error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch nearby issues";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Get high-priority issues
 * GET /api/issues/priorities
 */
export async function getHighPriorityIssues(req: Request, res: Response) {
  try {
    const { organizationId, limit } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const limitNum = limit ? parseInt(limit as string) : 20;

    const issues = await issuesService.getHighPriorityIssues(
      organizationId as string,
      limitNum
    );

    res.json({
      success: true,
      data: issues,
    });
  } catch (error: unknown) {
    console.error("Get high-priority issues error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch high-priority issues";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}

/**
 * Get issue statistics
 * GET /api/issues/stats
 */
export async function getIssueStats(req: Request, res: Response) {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const stats = await issuesService.getIssueStats(organizationId as string);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    console.error("Get issue stats error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch issue stats";
    res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
}
