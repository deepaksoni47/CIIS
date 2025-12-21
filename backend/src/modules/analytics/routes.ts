import { Router } from "express";
import * as analyticsController from "./analytics.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

/**
 * @route   GET /api/analytics/issues-per-building
 * @desc    Get issues per building over time (trend analysis)
 * @access  Private
 * @query   organizationId (required), startDate, endDate, groupBy (day|week|month)
 */
router.get(
  "/issues-per-building",
  authenticate,
  analyticsController.getIssuesPerBuilding
);

/**
 * @route   GET /api/analytics/common-issue-types
 * @desc    Get most common issue types with statistics
 * @access  Private
 * @query   organizationId (required), startDate, endDate, buildingId, limit
 */
router.get(
  "/common-issue-types",
  authenticate,
  analyticsController.getCommonIssueTypes
);

/**
 * @route   GET /api/analytics/resolution-times
 * @desc    Get resolution time averages with optional grouping
 * @access  Private
 * @query   organizationId (required), startDate, endDate, buildingId, groupBy (category|building|priority)
 */
router.get(
  "/resolution-times",
  authenticate,
  analyticsController.getResolutionTimes
);

/**
 * @route   GET /api/analytics/trends
 * @desc    Get comprehensive trend analysis with time series data
 * @access  Private
 * @query   organizationId (required), startDate, endDate, groupBy (day|week|month)
 */
router.get("/trends", authenticate, analyticsController.getComprehensiveTrends);

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get all analytics data for dashboard (combined response)
 * @access  Private
 * @query   organizationId (required), startDate, endDate, buildingId
 */
router.get(
  "/dashboard",
  authenticate,
  analyticsController.getDashboardAnalytics
);

/**
 * @route   GET /api/analytics/recurring-issues
 * @desc    Detect recurring issues (same issue type + location + time window)
 * @access  Private
 * @query   organizationId (required), timeWindowDays (default: 30), minOccurrences (default: 2), locationRadius (optional)
 */
router.get(
  "/recurring-issues",
  authenticate,
  analyticsController.getRecurringIssues
);

/**
 * @route   GET /api/analytics/admin-metrics
 * @desc    Get admin metrics (MTTR, high-risk buildings, issue growth rate)
 * @access  Private
 * @query   organizationId (required), timeWindowDays (default: 30), comparisonTimeWindowDays (optional)
 */
router.get("/admin-metrics", authenticate, analyticsController.getAdminMetrics);

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data to CSV
 * @access  Private
 * @query   organizationId (required), type (issues|mttr|buildings|summary), startDate, endDate, format (csv|json)
 */
router.get("/export", authenticate, analyticsController.exportAnalytics);

/**
 * @route   GET /api/analytics/snapshot
 * @desc    Get daily or weekly snapshot report
 * @access  Private
 * @query   organizationId (required), type (daily|weekly)
 */
router.get("/snapshot", authenticate, analyticsController.getSnapshotReport);

export default router;
