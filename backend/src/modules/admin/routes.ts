import { Router } from "express";
import { authenticateUser, requireAdmin } from "../../middlewares/auth";
import * as adminController from "./admin.controller";

const router = Router();

// All routes require authentication and admin role
router.use(authenticateUser);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard overview with key metrics
 * @access  Private (Admin only)
 */
router.get("/dashboard", adminController.getDashboardOverview);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with filters and pagination
 * @access  Private (Admin only)
 */
router.get("/users", adminController.getAllUsers);

/**
 * @route   GET /api/admin/users/export
 * @desc    Export users data as JSON or CSV
 * @access  Private (Admin only)
 */
router.get("/users/export", adminController.exportUsers);

/**
 * @route   PATCH /api/admin/users/bulk
 * @desc    Bulk update multiple users
 * @access  Private (Admin only)
 */
router.patch("/users/bulk", adminController.bulkUpdateUsers);

/**
 * @route   GET /api/admin/users/:userId
 * @desc    Get user details by ID
 * @access  Private (Admin only)
 */
router.get("/users/:userId", adminController.getUserById);

/**
 * @route   PATCH /api/admin/users/:userId
 * @desc    Update user details
 * @access  Private (Admin only)
 */
router.patch("/users/:userId", adminController.updateUser);

/**
 * @route   DELETE /api/admin/users/:userId
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete("/users/:userId", adminController.deleteUser);

/**
 * @route   PATCH /api/admin/users/:userId/toggle-status
 * @desc    Toggle user active/inactive status
 * @access  Private (Admin only)
 */
router.patch("/users/:userId/toggle-status", adminController.toggleUserStatus);

/**
 * @route   GET /api/admin/users/:userId/stats
 * @desc    Get detailed user statistics
 * @access  Private (Admin only)
 */
router.get("/users/:userId/stats", adminController.getUserStats);

/**
 * @route   GET /api/admin/users/:userId/activity
 * @desc    Get user activity logs
 * @access  Private (Admin only)
 */
router.get("/users/:userId/activity", adminController.getUserActivity);

/**
 * @route   GET /api/admin/issues
 * @desc    Get all issues with admin filters
 * @access  Private (Admin only)
 */
router.get("/issues", adminController.getAllIssues);

/**
 * @route   GET /api/admin/issues/export
 * @desc    Export issues data as JSON or CSV
 * @access  Private (Admin only)
 */
router.get("/issues/export", adminController.exportIssues);

/**
 * @route   GET /api/admin/analytics
 * @desc    Get system-wide analytics and insights
 * @access  Private (Admin only)
 */
router.get("/analytics", adminController.getSystemAnalytics);

export default router;
