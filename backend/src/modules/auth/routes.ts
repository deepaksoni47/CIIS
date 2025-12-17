import { Router } from "express";
import * as authController from "./auth.controller";
import { authenticate, authorize } from "./auth.middleware";
import { UserRole } from "../../types";

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Login/Register with Google OAuth
 * @access  Public
 */
router.post("/login", authController.loginWithGoogle);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authenticate, authController.getCurrentUser);

/**
 * @route   PATCH /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch("/profile", authenticate, authController.updateProfile);

/**
 * @route   GET /api/auth/users/:organizationId
 * @desc    Get users by organization
 * @access  Private (Admin/Facility Manager only)
 */
router.get(
  "/users/:organizationId",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.FACILITY_MANAGER),
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
  authController.deactivateUser
);

export default router;
