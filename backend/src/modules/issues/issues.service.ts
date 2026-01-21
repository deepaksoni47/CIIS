import { firestore } from "firebase-admin";
import { getFirestore } from "../../config/firebase";
import { uploadImageToCloudinary } from "../../config/cloudinary";
import {
  Issue,
  IssueHistory,
  IssueStatus,
  IssuePriority,
  IssueCategory,
  UserRole,
  User,
} from "../../types";
import { priorityEngine, PriorityInput } from "../priority/priority-engine";
import { WebSocketService } from "../../services/websocket.service";
import { SSEService } from "../../services/sse.service";
import * as emailService from "../../services/email.service";
import * as rewardsService from "../rewards/rewards.service";

const db = getFirestore();

/**
 * Create a new issue
 */
export async function createIssue(
  issueData: Partial<Issue>,
  userId: string,
  userRole: UserRole,
): Promise<Issue> {
  const issuesRef = db.collection("issues");

  // Use priority engine for deterministic scoring
  const priorityInput: PriorityInput = {
    category: (issueData.category as IssueCategory) || IssueCategory.OTHER,
    severity: issueData.severity,
    description: issueData.description,
    buildingId: issueData.buildingId,
    roomId: issueData.roomId,
    occupancy: issueData.occupancy,
    reportedAt: new Date(),
    blocksAccess: issueData.blocksAccess,
    safetyRisk: issueData.safetyRisk,
    criticalInfrastructure: issueData.criticalInfrastructure,
    affectsAcademics: issueData.affectsAcademics,
    examPeriod: issueData.examPeriod,
    currentSemester: issueData.currentSemester,
    isRecurring: issueData.isRecurring,
    previousOccurrences: issueData.previousOccurrences,
  };

  const priorityResult = priorityEngine.calculatePriority(priorityInput);

  const newIssue: Partial<Issue> = {
    ...issueData,
    severity: priorityInput.severity || calculateSeverity(issueData.category),
    priority: priorityResult.priority,
    aiRiskScore: priorityResult.score,
    status: IssueStatus.OPEN,
    reportedBy: userId,
    reportedByRole: userRole.toLowerCase() as any,
    createdAt: firestore.Timestamp.now(),
    updatedAt: firestore.Timestamp.now(),
  };

  const docRef = await issuesRef.add(newIssue);
  const issue = { id: docRef.id, ...newIssue } as Issue;

  // Log issue creation in history
  await createIssueHistory({
    issueId: issue.id,
    fieldName: "status",
    newValue: IssueStatus.OPEN,
    changedBy: userId,
    changeType: "status_change",
    comment: "Issue created",
    changedAt: firestore.Timestamp.now(),
  });

  // Emit real-time events
  try {
    const wsService = WebSocketService.getInstance();
    wsService.emitIssueCreated({
      issue,
      action: "created",
      timestamp: new Date(),
      organizationId: issue.organizationId,
      campusId: issue.campusId,
      buildingId: issue.buildingId,
    });

    // Trigger heatmap update
    wsService.emitHeatmapUpdated({
      organizationId: issue.organizationId,
      campusId: issue.campusId,
      buildingId: issue.buildingId,
      timestamp: new Date(),
      changeType: "issue_added",
      affectedArea: issue.location
        ? {
            latitude: issue.location.latitude,
            longitude: issue.location.longitude,
            radius: 100,
          }
        : undefined,
    });

    // SSE broadcast
    const sseService = SSEService.getInstance();
    sseService.sendIssueUpdate(
      issue.organizationId,
      issue.campusId,
      issue.buildingId,
      "issue:created",
      { issue, timestamp: new Date() },
    );
  } catch (error) {
    console.error("Error emitting real-time events:", error);
  }

  // Award points for creating an issue and update user statistics (async, non-blocking)
  try {
    const pointsForIssue = 10; // configurable default for issue creation
    rewardsService
      .awardPoints(
        userId,
        issue.organizationId as string,
        pointsForIssue,
        "issue_created",
        "Reported an issue",
        issue.id,
        "issue",
      )
      .catch((err) =>
        console.error("Error awarding points for issue creation:", err),
      );

    rewardsService
      .updateUserStatistics(userId, "issuesReported", 1)
      .catch((err) =>
        console.error(
          "Error updating user statistics for issue creation:",
          err,
        ),
      );
  } catch (err) {
    console.error("Failed to initiate reward actions for issue creation:", err);
  }

  return issue;
}

/**
 * Get issue by ID
 */
export async function getIssueById(issueId: string): Promise<Issue | null> {
  const issueDoc = await db.collection("issues").doc(issueId).get();

  if (!issueDoc.exists) {
    return null;
  }

  return { id: issueDoc.id, ...issueDoc.data() } as Issue;
}

/**
 * Get all issues with filters
 */
export async function getIssues(filters: {
  organizationId: string;
  buildingId?: string;
  departmentId?: string;
  roomId?: string;
  category?: IssueCategory;
  status?: IssueStatus;
  priority?: IssuePriority;
  reportedBy?: string;
  assignedTo?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}): Promise<{ issues: Issue[]; total: number }> {
  let query: any = db
    .collection("issues")
    .where("organizationId", "==", filters.organizationId);

  // Apply filters
  if (filters.buildingId) {
    query = query.where("buildingId", "==", filters.buildingId);
  }
  if (filters.departmentId) {
    query = query.where("departmentId", "==", filters.departmentId);
  }
  if (filters.roomId) {
    query = query.where("roomId", "==", filters.roomId);
  }
  if (filters.category) {
    query = query.where("category", "==", filters.category);
  }
  if (filters.status) {
    query = query.where("status", "==", filters.status);
  }
  if (filters.priority) {
    query = query.where("priority", "==", filters.priority);
  }
  if (filters.reportedBy) {
    query = query.where("reportedBy", "==", filters.reportedBy);
  }
  if (filters.assignedTo) {
    query = query.where("assignedTo", "==", filters.assignedTo);
  }
  if (filters.startDate) {
    query = query.where(
      "createdAt",
      ">=",
      firestore.Timestamp.fromDate(filters.startDate),
    );
  }
  if (filters.endDate) {
    query = query.where(
      "createdAt",
      "<=",
      firestore.Timestamp.fromDate(filters.endDate),
    );
  }

  // If client requested a limit, try to apply server-side ordering and limit to reduce reads
  // Note: When filtering by reportedBy, we can't use orderBy due to composite index requirements
  let firestoreQuery: any = query;
  let needsClientSideSorting = false;
  const MAX_LIMIT = 500; // safety cap
  const requestedLimit = Math.min(MAX_LIMIT, filters.limit || 0);
  if (requestedLimit > 0) {
    // Check if we have filters that would require composite indexes for ordering
    const hasCompositeFilter =
      filters.reportedBy ||
      filters.assignedTo ||
      filters.buildingId ||
      filters.departmentId ||
      filters.roomId;

    if (!hasCompositeFilter) {
      try {
        firestoreQuery = query
          .orderBy("createdAt", "desc")
          .limit(requestedLimit + (filters.offset || 0));
      } catch (err: any) {
        console.warn(
          "Could not apply server-side order/limit, falling back to full scan:",
          err?.message || err,
        );
        firestoreQuery = query;
        needsClientSideSorting = true;
      }
    } else {
      // For composite queries, we'll sort client-side
      firestoreQuery = query.limit(requestedLimit + (filters.offset || 0));
      needsClientSideSorting = true;
    }
  }

  // Fetch documents
  const snapshot = await firestoreQuery.get();

  // Map docs to issues
  let issues: Issue[] = snapshot.docs.map((doc: any) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Sort issues by createdAt descending if not already sorted server-side
  if (!requestedLimit || needsClientSideSorting) {
    issues.sort((a, b) => {
      const aTime = (a.createdAt as any)?.seconds || 0;
      const bTime = (b.createdAt as any)?.seconds || 0;
      return bTime - aTime;
    });
  }

  const total = issues.length;

  // Apply pagination after sorting or server-side limit
  if (filters.offset || filters.limit) {
    const start = filters.offset || 0;
    const end = filters.limit ? start + filters.limit : issues.length;
    issues = issues.slice(start, end);
  }

  return { issues, total };
}

/**
 * Update issue
 */
export async function updateIssue(
  issueId: string,
  updates: Partial<Issue>,
  userId: string,
): Promise<Issue> {
  const issueRef = db.collection("issues").doc(issueId);
  const issueDoc = await issueRef.get();

  if (!issueDoc.exists) {
    throw new Error("Issue not found");
  }

  const oldIssue = issueDoc.data() as Issue;

  const updatedData = {
    ...updates,
    updatedAt: firestore.Timestamp.now(),
  };

  await issueRef.update(updatedData);

  // Log changes in history
  for (const [field, newValue] of Object.entries(updates)) {
    const oldValue = (oldIssue as any)[field];
    if (oldValue !== newValue) {
      await createIssueHistory({
        issueId,
        fieldName: field,
        oldValue,
        newValue,
        changedBy: userId,
        changeType: "update",
        changedAt: firestore.Timestamp.now(),
      });
    }
  }

  const updatedIssue = { ...oldIssue, ...updatedData, id: issueId } as Issue;

  // Emit real-time events
  try {
    const wsService = WebSocketService.getInstance();
    wsService.emitIssueUpdated({
      issue: updatedIssue,
      action: "updated",
      timestamp: new Date(),
      organizationId: updatedIssue.organizationId,
      campusId: updatedIssue.campusId,
      buildingId: updatedIssue.buildingId,
    });

    // Trigger heatmap update if location/priority changed
    if (updates.location || updates.priority || updates.severity) {
      wsService.emitHeatmapUpdated({
        organizationId: updatedIssue.organizationId,
        campusId: updatedIssue.campusId,
        buildingId: updatedIssue.buildingId,
        timestamp: new Date(),
        changeType: "issue_updated",
      });
    }

    const sseService = SSEService.getInstance();
    sseService.sendIssueUpdate(
      updatedIssue.organizationId,
      updatedIssue.campusId,
      updatedIssue.buildingId,
      "issue:updated",
      { issue: updatedIssue, timestamp: new Date() },
    );
  } catch (error) {
    console.error("Error emitting update events:", error);
  }

  return updatedIssue;
}

/**
 * Resolve issue
 */
export async function resolveIssue(
  issueId: string,
  userId: string,
  resolutionComment?: string,
  actualCost?: number,
  actualDuration?: number,
): Promise<Issue> {
  const issueRef = db.collection("issues").doc(issueId);
  const issueDoc = await issueRef.get();

  if (!issueDoc.exists) {
    throw new Error("Issue not found");
  }

  const resolvedData: Partial<Issue> = {
    status: IssueStatus.RESOLVED,
    resolvedAt: firestore.Timestamp.now(),
    updatedAt: firestore.Timestamp.now(),
  };

  if (actualCost !== undefined) {
    resolvedData.actualCost = actualCost;
  }
  if (actualDuration !== undefined) {
    resolvedData.actualDuration = actualDuration;
  }

  await issueRef.update(resolvedData);

  // Log resolution in history
  await createIssueHistory({
    issueId,
    fieldName: "status",
    oldValue: IssueStatus.IN_PROGRESS,
    newValue: IssueStatus.RESOLVED,
    changedBy: userId,
    changeType: "resolution",
    comment: resolutionComment,
    changedAt: firestore.Timestamp.now(),
  });

  const issue = issueDoc.data() as Issue;
  const resolvedIssue = { ...issue, ...resolvedData, id: issueId } as Issue;

  // Emit real-time events
  try {
    const wsService = WebSocketService.getInstance();
    wsService.emitIssueResolved({
      issue: resolvedIssue,
      action: "resolved",
      timestamp: new Date(),
      organizationId: resolvedIssue.organizationId,
      campusId: resolvedIssue.campusId,
      buildingId: resolvedIssue.buildingId,
    });

    // Update heatmap (issue resolved)
    wsService.emitHeatmapUpdated({
      organizationId: resolvedIssue.organizationId,
      campusId: resolvedIssue.campusId,
      buildingId: resolvedIssue.buildingId,
      timestamp: new Date(),
      changeType: "issue_resolved",
    });

    const sseService = SSEService.getInstance();
    sseService.sendIssueUpdate(
      resolvedIssue.organizationId,
      resolvedIssue.campusId,
      resolvedIssue.buildingId,
      "issue:resolved",
      { issue: resolvedIssue, timestamp: new Date() },
    );
  } catch (error) {
    console.error("Error emitting resolution events:", error);
  }

  // Send email notification to the user who reported the issue (non-blocking)
  try {
    const reporterRef = db.collection("users").doc(resolvedIssue.reportedBy);
    const reporterDoc = await reporterRef.get();

    if (reporterDoc.exists) {
      const reporter = { id: reporterDoc.id, ...reporterDoc.data() } as User;
      emailService
        .sendIssueResolvedEmail(reporter, resolvedIssue, resolutionComment)
        .catch((error) => {
          console.error("Failed to send issue resolution email:", error);
        });
    }
  } catch (error) {
    console.error("Error sending resolution email:", error);
  }

  return resolvedIssue;
}

/**
 * Assign issue to user
 */
export async function assignIssue(
  issueId: string,
  assignedToUserId: string,
  assignedByUserId: string,
): Promise<Issue> {
  const issueRef = db.collection("issues").doc(issueId);
  const issueDoc = await issueRef.get();

  if (!issueDoc.exists) {
    throw new Error("Issue not found");
  }

  const oldIssue = issueDoc.data() as Issue;

  await issueRef.update({
    assignedTo: assignedToUserId,
    status: IssueStatus.IN_PROGRESS,
    updatedAt: firestore.Timestamp.now(),
  });

  // Log assignment in history
  await createIssueHistory({
    issueId,
    fieldName: "assignedTo",
    oldValue: oldIssue.assignedTo,
    newValue: assignedToUserId,
    changedBy: assignedByUserId,
    changeType: "assignment",
    changedAt: firestore.Timestamp.now(),
  });

  const assignedIssue = {
    ...oldIssue,
    id: issueId,
    assignedTo: assignedToUserId,
    status: IssueStatus.IN_PROGRESS,
    updatedAt: firestore.Timestamp.now(),
  } as Issue;

  // Emit real-time events
  try {
    const wsService = WebSocketService.getInstance();
    wsService.emitIssueAssigned({
      issue: assignedIssue,
      action: "assigned",
      timestamp: new Date(),
      organizationId: assignedIssue.organizationId,
      campusId: assignedIssue.campusId,
      buildingId: assignedIssue.buildingId,
      affectedUsers: [assignedToUserId],
    });

    const sseService = SSEService.getInstance();
    sseService.sendIssueUpdate(
      assignedIssue.organizationId,
      assignedIssue.campusId,
      assignedIssue.buildingId,
      "issue:assigned",
      {
        issue: assignedIssue,
        assignedTo: assignedToUserId,
        timestamp: new Date(),
      },
    );
  } catch (error) {
    console.error("Error emitting assignment events:", error);
  }

  return assignedIssue;
}

/**
 * Delete issue (soft delete by closing)
 */
export async function deleteIssue(
  issueId: string,
  userId: string,
): Promise<void> {
  const issueRef = db.collection("issues").doc(issueId);
  const issueDoc = await issueRef.get();

  if (!issueDoc.exists) {
    throw new Error("Issue not found");
  }

  await issueRef.update({
    status: IssueStatus.CLOSED,
    updatedAt: firestore.Timestamp.now(),
  });

  // Log closure in history
  await createIssueHistory({
    issueId,
    fieldName: "status",
    oldValue: issueDoc.data()!.status,
    newValue: IssueStatus.CLOSED,
    changedBy: userId,
    changeType: "status_change",
    comment: "Issue closed/deleted",
    changedAt: firestore.Timestamp.now(),
  });

  const issue = issueDoc.data() as Issue;

  // Send email notification to the user who reported the issue (non-blocking)
  try {
    const reporterRef = db.collection("users").doc(issue.reportedBy);
    const reporterDoc = await reporterRef.get();

    if (reporterDoc.exists) {
      const reporter = { id: reporterDoc.id, ...reporterDoc.data() } as User;
      emailService
        .sendIssueDeletedEmail(reporter, { ...issue, id: issueId })
        .catch((error) => {
          console.error("Failed to send issue deletion email:", error);
        });
    }
  } catch (error) {
    console.error("Error sending deletion email:", error);
  }

  // Emit real-time events
  try {
    const wsService = WebSocketService.getInstance();
    wsService.emitIssueDeleted({
      issue: { ...issue, id: issueId, status: IssueStatus.CLOSED },
      action: "deleted",
      timestamp: new Date(),
      organizationId: issue.organizationId,
      campusId: issue.campusId,
      buildingId: issue.buildingId,
    });

    // Update heatmap
    wsService.emitHeatmapUpdated({
      organizationId: issue.organizationId,
      campusId: issue.campusId,
      buildingId: issue.buildingId,
      timestamp: new Date(),
      changeType: "issue_resolved",
    });

    const sseService = SSEService.getInstance();
    sseService.sendIssueUpdate(
      issue.organizationId,
      issue.campusId,
      issue.buildingId,
      "issue:deleted",
      { issueId, timestamp: new Date() },
    );
  } catch (error) {
    console.error("Error emitting deletion events:", error);
  }
}

/**
 * Get issue history
 */
export async function getIssueHistory(
  issueId: string,
): Promise<IssueHistory[]> {
  const historySnapshot = await db
    .collection("issue_history")
    .where("issueId", "==", issueId)
    .orderBy("changedAt", "desc")
    .get();

  return historySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IssueHistory[];
}

/**
 * Upload image for issue using Cloudinary
 */
export async function uploadIssueImage(
  file: Buffer,
  fileName: string,
  organizationId: string,
  issueId?: string,
): Promise<string> {
  try {
    // Create folder path in Cloudinary
    const folder = issueId
      ? `ciis/issues/${organizationId}/${issueId}`
      : `ciis/issues/${organizationId}/temp`;

    // Remove file extension and timestamp for cleaner public_id
    const cleanFileName = fileName.replace(/\.[^/.]+$/, "");

    // Upload to Cloudinary
    const imageUrl = await uploadImageToCloudinary(file, folder, cleanFileName);

    console.log(`✅ Image uploaded to Cloudinary: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

/**
 * Get issues by geographic proximity
 */
export async function getIssuesByProximity(
  organizationId: string,
  centerLat: number,
  centerLng: number,
  radiusKm: number,
): Promise<Issue[]> {
  // Firestore doesn't support geospatial queries directly
  // We need to get all issues and filter in memory
  const allIssues = await db
    .collection("issues")
    .where("organizationId", "==", organizationId)
    .where("status", "!=", IssueStatus.CLOSED)
    .get();

  const issues: Issue[] = [];

  for (const doc of allIssues.docs) {
    const issue = { id: doc.id, ...doc.data() } as Issue;
    const distance = calculateDistance(
      centerLat,
      centerLng,
      issue.location.latitude,
      issue.location.longitude,
    );

    if (distance <= radiusKm) {
      issues.push(issue);
    }
  }

  return issues;
}

/**
 * Get high-priority issues for a campus
 */
export async function getHighPriorityIssues(
  organizationId: string,
  limit: number = 20,
): Promise<Issue[]> {
  // Query for high-priority open issues with a limit to prevent quota exhaustion
  const db = getFirestore();

  const snapshot = await db
    .collection("issues")
    .where("organizationId", "==", organizationId)
    .where("status", "in", [IssueStatus.OPEN, IssueStatus.IN_PROGRESS])
    .where("priority", "in", [IssuePriority.HIGH, IssuePriority.CRITICAL])
    .orderBy("aiRiskScore", "desc")
    .limit(limit * 2) // Fetch more to ensure we have enough after sorting
    .get();

  const issues = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Issue[];

  return issues.slice(0, limit);
}

/**
 * Get issue statistics for a campus
 */
export async function getIssueStats(organizationId: string): Promise<{
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTime: number;
}> {
  // Add limit to prevent quota exhaustion
  const allIssues = await db
    .collection("issues")
    .where("organizationId", "==", organizationId)
    .limit(10000)
    .get();

  const stats = {
    total: allIssues.size,
    open: 0,
    inProgress: 0,
    resolved: 0,
    byCategory: {} as Record<string, number>,
    byPriority: {} as Record<string, number>,
    avgResolutionTime: 0,
  };

  let totalResolutionTime = 0;
  let resolvedCount = 0;

  allIssues.docs.forEach((doc) => {
    const issue = doc.data() as Issue;

    // Count by status
    if (issue.status === IssueStatus.OPEN) stats.open++;
    if (issue.status === IssueStatus.IN_PROGRESS) stats.inProgress++;
    if (issue.status === IssueStatus.RESOLVED) {
      stats.resolved++;
      if (issue.resolvedAt) {
        const resolutionTime =
          issue.resolvedAt.toMillis() - issue.createdAt.toMillis();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }

    // Count by category
    stats.byCategory[issue.category] =
      (stats.byCategory[issue.category] || 0) + 1;

    // Count by priority
    stats.byPriority[issue.priority] =
      (stats.byPriority[issue.priority] || 0) + 1;
  });

  // Calculate average resolution time in hours
  if (resolvedCount > 0) {
    stats.avgResolutionTime =
      totalResolutionTime / resolvedCount / 1000 / 60 / 60;
  }

  return stats;
}

/**
 * Helper: Create issue history entry
 */
async function createIssueHistory(
  historyData: Partial<IssueHistory>,
): Promise<void> {
  await db.collection("issue_history").add(historyData);
}

/**
 * Helper: Calculate issue severity
 */
function calculateSeverity(category?: string): number {
  const severityMap: Record<string, number> = {
    [IssueCategory.SAFETY]: 9,
    [IssueCategory.STRUCTURAL]: 8,
    [IssueCategory.ELECTRICAL]: 7,
    [IssueCategory.PLUMBING]: 6,
    [IssueCategory.HVAC]: 5,
    [IssueCategory.NETWORK]: 4,
    [IssueCategory.MAINTENANCE]: 5,
    [IssueCategory.CLEANLINESS]: 3,
    [IssueCategory.FURNITURE]: 2,
    [IssueCategory.OTHER]: 3,
  };

  return category ? severityMap[category] || 5 : 5;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of first point
 * @param lon1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lon2 - Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c * 1000; // Convert km to meters
}
