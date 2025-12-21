import { Request, Response } from "express";
import * as analyticsService from "./analytics.service";

/**
 * Get issues per building over time
 * GET /api/analytics/issues-per-building
 */
export async function getIssuesPerBuilding(req: Request, res: Response) {
  try {
    const { organizationId, startDate, endDate, groupBy } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const validGroupBy = ["day", "week", "month"].includes(groupBy as string)
      ? (groupBy as "day" | "week" | "month")
      : "day";

    const data = await analyticsService.getIssuesPerBuildingOverTime(
      organizationId as string,
      start,
      end,
      validGroupBy
    );

    res.json({
      success: true,
      data,
      metadata: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        groupBy: validGroupBy,
      },
    });
  } catch (error) {
    console.error("Error getting issues per building:", error);
    res.status(500).json({
      error: "Failed to get issues per building",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get most common issue types
 * GET /api/analytics/common-issue-types
 */
export async function getCommonIssueTypes(req: Request, res: Response) {
  try {
    const { organizationId, startDate, endDate, buildingId, limit } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const parsedLimit = limit ? parseInt(limit as string, 10) : 10;

    const data = await analyticsService.getMostCommonIssueTypes(
      organizationId as string,
      start,
      end,
      buildingId as string | undefined,
      parsedLimit
    );

    res.json({
      success: true,
      data,
      metadata: {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
        buildingId,
        limit: parsedLimit,
      },
    });
  } catch (error) {
    console.error("Error getting common issue types:", error);
    res.status(500).json({
      error: "Failed to get common issue types",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get resolution time averages
 * GET /api/analytics/resolution-times
 */
export async function getResolutionTimes(req: Request, res: Response) {
  try {
    const { organizationId, startDate, endDate, buildingId, groupBy } =
      req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const validGroupBy = ["category", "building", "priority"].includes(
      groupBy as string
    )
      ? (groupBy as "category" | "building" | "priority")
      : undefined;

    const data = await analyticsService.getResolutionTimeAverages(
      organizationId as string,
      start,
      end,
      buildingId as string | undefined,
      validGroupBy
    );

    res.json({
      success: true,
      data,
      metadata: {
        startDate: start?.toISOString(),
        endDate: end?.toISOString(),
        buildingId,
        groupBy: validGroupBy,
      },
    });
  } catch (error) {
    console.error("Error getting resolution times:", error);
    res.status(500).json({
      error: "Failed to get resolution times",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get comprehensive trend analysis
 * GET /api/analytics/trends
 */
export async function getComprehensiveTrends(req: Request, res: Response) {
  try {
    const { organizationId, startDate, endDate, groupBy } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    // Default to last 30 days if no dates provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const validGroupBy = ["day", "week", "month"].includes(groupBy as string)
      ? (groupBy as "day" | "week" | "month")
      : "day";

    const data = await analyticsService.getComprehensiveTrends(
      organizationId as string,
      start,
      end,
      validGroupBy
    );

    res.json({
      success: true,
      data,
      metadata: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        groupBy: validGroupBy,
      },
    });
  } catch (error) {
    console.error("Error getting comprehensive trends:", error);
    res.status(500).json({
      error: "Failed to get comprehensive trends",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get all analytics (combined response)
 * GET /api/analytics/dashboard
 */
export async function getDashboardAnalytics(req: Request, res: Response) {
  try {
    const { organizationId, startDate, endDate, buildingId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    // Default to last 30 days
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all analytics in parallel
    const [
      issuesPerBuilding,
      commonIssueTypes,
      resolutionTimes,
      comprehensiveTrends,
    ] = await Promise.all([
      analyticsService.getIssuesPerBuildingOverTime(
        organizationId as string,
        start,
        end,
        "day"
      ),
      analyticsService.getMostCommonIssueTypes(
        organizationId as string,
        start,
        end,
        buildingId as string | undefined,
        10
      ),
      analyticsService.getResolutionTimeAverages(
        organizationId as string,
        start,
        end,
        buildingId as string | undefined,
        "category"
      ),
      analyticsService.getComprehensiveTrends(
        organizationId as string,
        start,
        end,
        "day"
      ),
    ]);

    res.json({
      success: true,
      data: {
        issuesPerBuilding,
        commonIssueTypes,
        resolutionTimes,
        trends: comprehensiveTrends,
      },
      metadata: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        buildingId,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard analytics:", error);
    res.status(500).json({
      error: "Failed to get dashboard analytics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Detect recurring issues
 * GET /api/analytics/recurring-issues
 */
export async function getRecurringIssues(req: Request, res: Response) {
  try {
    const { organizationId, timeWindowDays, minOccurrences, locationRadius } =
      req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const parsedTimeWindow = timeWindowDays
      ? parseInt(timeWindowDays as string, 10)
      : 30;

    const parsedMinOccurrences = minOccurrences
      ? parseInt(minOccurrences as string, 10)
      : 2;

    const parsedLocationRadius = locationRadius
      ? parseFloat(locationRadius as string)
      : undefined;

    const data = await analyticsService.detectRecurringIssues(
      organizationId as string,
      parsedTimeWindow,
      parsedMinOccurrences,
      parsedLocationRadius
    );

    res.json({
      success: true,
      data,
      metadata: {
        timeWindowDays: parsedTimeWindow,
        minOccurrences: parsedMinOccurrences,
        locationRadius: parsedLocationRadius,
      },
    });
  } catch (error) {
    console.error("Error detecting recurring issues:", error);
    res.status(500).json({
      error: "Failed to detect recurring issues",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get admin metrics (MTTR, high-risk buildings, issue growth rate)
 * GET /api/analytics/admin-metrics
 */
export async function getAdminMetrics(req: Request, res: Response) {
  try {
    const { organizationId, timeWindowDays, comparisonTimeWindowDays } =
      req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const parsedTimeWindow = timeWindowDays
      ? parseInt(timeWindowDays as string, 10)
      : 30;

    const parsedComparisonWindow = comparisonTimeWindowDays
      ? parseInt(comparisonTimeWindowDays as string, 10)
      : undefined;

    const data = await analyticsService.getAdminMetrics(
      organizationId as string,
      parsedTimeWindow,
      parsedComparisonWindow
    );

    res.json({
      success: true,
      data,
      metadata: {
        timeWindowDays: parsedTimeWindow,
        comparisonTimeWindowDays: parsedComparisonWindow,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error getting admin metrics:", error);
    res.status(500).json({
      error: "Failed to get admin metrics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Export analytics data to CSV
 * GET /api/analytics/export
 */
export async function exportAnalytics(req: Request, res: Response) {
  try {
    const { organizationId, type, startDate, endDate, format } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    if (!type) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "type is required (issues, mttr, buildings, summary)",
      });
    }

    // Default to last 30 days if dates not provided
    const end = endDate ? new Date(endDate as string) : new Date();
    const start = startDate
      ? new Date(startDate as string)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const exportType = type as "issues" | "mttr" | "buildings" | "summary";
    const csvData = await analyticsService.exportAnalyticsToCSV(
      organizationId as string,
      exportType,
      start,
      end
    );

    // Set headers for file download
    const filename = `${exportType}-export-${start.toISOString().split("T")[0]}-to-${end.toISOString().split("T")[0]}.csv`;

    if (format === "json") {
      // Return CSV as JSON string
      res.json({
        success: true,
        data: {
          csv: csvData,
          filename,
        },
      });
    } else {
      // Return as downloadable CSV file
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(csvData);
    }
  } catch (error) {
    console.error("Error exporting analytics:", error);
    res.status(500).json({
      error: "Failed to export analytics",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Get daily or weekly snapshot report
 * GET /api/analytics/snapshot
 */
export async function getSnapshotReport(req: Request, res: Response) {
  try {
    const { organizationId, type } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    const snapshotType = type === "weekly" ? "weekly" : "daily";

    const report = await analyticsService.generateSnapshotReport(
      organizationId as string,
      snapshotType
    );

    res.json({
      success: true,
      data: report,
      metadata: {
        snapshotType,
      },
    });
  } catch (error) {
    console.error("Error generating snapshot report:", error);
    res.status(500).json({
      error: "Failed to generate snapshot report",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
