import { Router } from "express";
import * as issuesController from "./issues.controller";
import { authenticate, authorize } from "../auth/auth.middleware";
import { UserRole } from "../../types";
import {
  validateIssueCreation,
  validateIssueUpdate,
  validateId,
  validatePagination,
  validateSearchQuery,
  validateCoordinates,
} from "../../middlewares/validation.middleware";
import {
  issueCreationRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
} from "../../middlewares/rateLimiter.middleware";
import {
  uploadImage,
  handleUploadErrors,
  validateUploadedFiles,
  validateFileContent,
} from "../../middlewares/upload.middleware";

const router = Router();

/**
 * @route   POST /api/issues
 * @desc    Create a new issue
 * @access  Private (All authenticated users)
 */
router.post(
  "/",
  authenticate,
  issueCreationRateLimiter,
  validateIssueCreation,
  issuesController.createIssue
);

/**
 * @route   GET /api/issues
 * @desc    Get all issues with filters
 * @access  Private (All authenticated users)
 */
router.get(
  "/",
  authenticate,
  apiRateLimiter,
  validatePagination,
  validateSearchQuery,
  issuesController.getIssues
);

/**
 * @route   GET /api/issues/nearby
 * @desc    Get nearby issues for heatmap
 * @access  Private (All authenticated users)
 */
router.get(
  "/nearby",
  authenticate,
  apiRateLimiter,
  validateCoordinates,
  issuesController.getNearbyIssues
);

/**
 * @route   GET /api/issues/priorities
 * @desc    Get high-priority issues
 * @access  Private (All authenticated users)
 */
router.get("/priorities", authenticate, issuesController.getHighPriorityIssues);

/**
 * @route   GET /api/issues/stats
 * @desc    Get issue statistics
 * @access  Private (Facility Manager, Admin)
 */
router.get(
  "/stats",
  authenticate,
  authorize(UserRole.FACILITY_MANAGER, UserRole.ADMIN),
  issuesController.getIssueStats
);

/**
 * @route   POST /api/issues/upload-image
 * @desc    Upload image for issue
 * @access  Private (All authenticated users)
 */
router.post(
  "/upload-image",
  authenticate,
  uploadRateLimiter,
  uploadImage.array("images", 10),
  handleUploadErrors,
  validateUploadedFiles,
  validateFileContent,
  issuesController.uploadImage
);

/**
 * @route   GET /api/issues/:id
 * @desc    Get issue by ID
 * @access  Private (All authenticated users)
 */
router.get(
  "/:id",
  authenticate,
  apiRateLimiter,
  validateId("id"),
  issuesController.getIssue
);

/**
 * @route   PATCH /api/issues/:id
 * @desc    Update issue
 * @access  Private (Facility Manager, Admin, or issue reporter)
 */
router.patch(
  "/:id",
  authenticate,
  apiRateLimiter,
  validateIssueUpdate,
  issuesController.updateIssue
);

/**
 * @route   PATCH /api/issues/:id/resolve
 * @desc    Resolve issue
 * @access  Private (Staff, Facility Manager, Admin only)
 */
router.patch(
  "/:id/resolve",
  authenticate,
  authorize(UserRole.STAFF, UserRole.FACILITY_MANAGER, UserRole.ADMIN),
  issuesController.resolveIssue
);

/**
 * @route   PATCH /api/issues/:id/assign
 * @desc    Assign issue to user
 * @access  Private (Facility Manager, Admin only)
 */
router.patch(
  "/:id/assign",
  authenticate,
  authorize(UserRole.FACILITY_MANAGER, UserRole.ADMIN),
  issuesController.assignIssue
);

/**
 * @route   GET /api/issues/:id/history
 * @desc    Get issue history
 * @access  Private (All authenticated users)
 */
router.get("/:id/history", authenticate, issuesController.getIssueHistory);

/**
 * @route   DELETE /api/issues/:id
 * @desc    Close/Delete issue
 * @access  Private (All authenticated users - can delete own issues; Admins/Facility Managers can delete any)
 */
router.delete(
  "/:id",
  authenticate,
  apiRateLimiter,
  issuesController.deleteIssue
);

export default router;
