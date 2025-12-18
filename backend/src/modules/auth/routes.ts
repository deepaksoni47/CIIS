import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate, authorize } from "./auth.middleware";
import { UserRole } from "../../types";
import {
  validateId,
  validateUserRole,
  handleValidationErrors,
} from "../../middlewares/validation.middleware";
import {
  authRateLimiter,
  apiRateLimiter,
} from "../../middlewares/rateLimiter.middleware";
import { body } from "express-validator";

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
router.post(
  "/login",
  authRateLimiter,
  body("idToken")
    .trim()
    .notEmpty()
    .withMessage("ID token is required")
    .isLength({ max: 5000 })
    .withMessage("Invalid token format"),
  handleValidationErrors,
  authController.loginWithGoogle
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authenticate, apiRateLimiter, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, apiRateLimiter, authController.getCurrentUser);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch(
  "/profile",
  authenticate,
  apiRateLimiter,
  body("displayName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Display name must be between 2 and 100 characters"),
  body("phone")
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Invalid phone number format"),
  handleValidationErrors,
  authController.updateProfile
);

/**
 * @route   GET /api/auth/users/:organizationId
 * @desc    Get users by organization
 * @access  Private (Admin/Facility Manager only)
 */
router.get(
  "/users/:organizationId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACILITY_MANAGER),
  apiRateLimiter,
  validateId("organizationId"),
  authController.getOrganizationUsers
);

/**
 * @route   PATCH /api/auth/users/:userId/role
 * @desc    Update user role
 * @access  Private (Admin only)
 */
router.patch(
  "/users/:userId/role",
  authenticate,
  authorize(UserRole.ADMIN),
  apiRateLimiter,
  validateId("userId"),
  validateUserRole,
  authController.updateUserRole
);

/**
 * @route   DELETE /api/auth/users/:userId
 * @desc    Deactivate user
 * @access  Private (Admin only)
 */
router.delete(
  "/users/:userId",
  authenticate,
  authorize(UserRole.ADMIN),
  apiRateLimiter,
  validateId("userId"),
  authController.deactivateUser
);

export default router;
