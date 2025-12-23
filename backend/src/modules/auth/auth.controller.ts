import { Request, Response } from "express";
import * as authService from "./auth.service";
import { UserRole } from "../../types";
import * as emailService from "../../services/email.service";

/**
 * Login/Register with Google OAuth
 * Client sends Firebase ID token after Google sign-in
 */
export async function loginWithGoogle(req: Request, res: Response) {
  try {
    const { idToken, organizationId, role } = req.body;

    if (!idToken) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "idToken is required",
      });
    }

    if (!organizationId) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "organizationId is required",
      });
    }

    // Verify Firebase ID token
    const decodedToken = await authService.verifyIdToken(idToken);

    // Get or create user in Firestore
    const { user, isNewUser } = await authService.getOrCreateUser(
      decodedToken,
      organizationId,
      role as UserRole
    );

    // Send welcome email for new users (non-blocking)
    if (isNewUser) {
      emailService.sendWelcomeEmail(user).catch((error) => {
        console.error("Failed to send welcome email:", error);
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          departmentId: user.departmentId,
          permissions: user.permissions,
        },
        token: idToken, // Client can reuse this token
      },
      message: isNewUser ? "Registration successful" : "Login successful",
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Login failed";
    res.status(401).json({
      error: "Authentication failed",
      message: errorMessage,
    });
  }
}

/**
 * Register with email and password
 * POST /api/auth/register
 */
export async function registerWithEmail(req: Request, res: Response) {
  try {
    const { email, password, name, organizationId, role } = req.body;

    // Validate required fields
    if (!email || !password || !name || !organizationId) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "email, password, name, and organizationId are required",
      });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        error: "Weak password",
        message: "Password must be at least 6 characters long",
      });
    }

    // Create user in Firebase Auth and Firestore
    const { user, token } = await authService.createUserWithEmail(
      email,
      password,
      name,
      organizationId,
      role as UserRole
    );

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(user).catch((error) => {
      console.error("Failed to send welcome email:", error);
    });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          departmentId: user.departmentId,
          permissions: user.permissions,
        },
        token,
      },
      message: "Registration successful",
    });
  } catch (error: unknown) {
    console.error("Registration error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Registration failed";
    res.status(400).json({
      error: "Registration failed",
      message: errorMessage,
    });
  }
}

/**
 * Login with email and password
 * POST /api/auth/login
 */
export async function loginWithEmail(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "email and password are required",
      });
    }

    // Authenticate user and get custom token
    const { user, token } = await authService.authenticateWithEmail(
      email,
      password
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          departmentId: user.departmentId,
          permissions: user.permissions,
        },
        token,
      },
      message: "Login successful",
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Invalid credentials";
    res.status(401).json({
      error: "Authentication failed",
      message: errorMessage,
    });
  }
}

/**
 * Get current user profile
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        message: "User does not exist",
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        departmentId: user.departmentId,
        phone: user.phone,
        permissions: user.permissions,
        preferences: user.preferences,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error("Get user error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get user";
    res.status(500).json({
      error: "Server error",
      message: errorMessage,
    });
  }
}

/**
 * Update user profile
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const updates = req.body;

    // Students/faculty can only update specific fields
    const allowedFields = ["name", "phone", "preferences"];
    const safeUpdates = Object.keys(updates)
      .filter((key) => allowedFields.includes(key))
      .reduce((obj: Record<string, unknown>, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    const updatedUser = await authService.updateUserProfile(
      userId,
      safeUpdates
    );

    res.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error: unknown) {
    console.error("Update profile error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update profile";
    res.status(500).json({
      error: "Update failed",
      message: errorMessage,
    });
  }
}

/**
 * Get users by organization (admin/facility manager only)
 */
export async function getOrganizationUsers(req: Request, res: Response) {
  try {
    const { organizationId } = req.params;
    const { role } = req.query;

    const users = await authService.getUsersByOrganization(
      organizationId,
      role as UserRole
    );

    res.json({
      success: true,
      data: users.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        departmentId: user.departmentId,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      })),
    });
  } catch (error: unknown) {
    console.error("Get users error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to get users";
    res.status(500).json({
      error: "Server error",
      message: errorMessage,
    });
  }
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        error: "Missing parameter",
        message: "role is required",
      });
    }

    const validRoles: UserRole[] = [
      UserRole.ADMIN,
      UserRole.FACILITY_MANAGER,
      UserRole.STAFF,
      UserRole.FACULTY,
      UserRole.STUDENT,
    ];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: "Invalid role",
        message: `Role must be one of: ${validRoles.join(", ")}`,
      });
    }

    const updatedUser = await authService.updateUserRole(userId, role);

    res.json({
      success: true,
      data: updatedUser,
      message: "User role updated successfully",
    });
  } catch (error: unknown) {
    console.error("Update role error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update role";
    res.status(500).json({
      error: "Update failed",
      message: errorMessage,
    });
  }
}

/**
 * Deactivate user (admin only)
 */
export async function deactivateUser(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    await authService.deactivateUser(userId);

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error: unknown) {
    console.error("Deactivate user error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to deactivate user";
    res.status(500).json({
      error: "Deactivation failed",
      message: errorMessage,
    });
  }
}

/**
 * Logout (client-side primarily, but can log event)
 */
export async function logout(_req: Request, res: Response) {
  try {
    // In Firebase Auth, logout is primarily client-side
    // But we can log the event for analytics
    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error: unknown) {
    console.error("Logout error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Logout failed";
    res.status(500).json({
      error: "Logout failed",
      message: errorMessage,
    });
  }
}

/**
 * Change password
 * POST /api/auth/change-password
 */
export async function changePassword(req: Request, res: Response) {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Missing parameters",
        message: "currentPassword and newPassword are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Weak password",
        message: "New password must be at least 6 characters long",
      });
    }

    await authService.changePassword(userId, currentPassword, newPassword);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error: unknown) {
    console.error("Change password error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to change password";
    res.status(400).json({
      error: "Password change failed",
      message: errorMessage,
    });
  }
}
