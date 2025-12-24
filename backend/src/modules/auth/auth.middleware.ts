import { Request, Response, NextFunction } from "express";
import { getAuth } from "../../config/firebase";
import * as authService from "./auth.service";
import { UserRole, User } from "../../types";
import { AuthUser } from "../../middlewares/auth";

// Extend Express Request type to include additional user data
declare module "express-serve-static-core" {
  interface Request {
    userData?: {
      id: string;
      organizationId: string;
      role: UserRole;
      permissions: Record<string, boolean>;
    };
  }
}

/**
 * Authenticate Firebase ID token from Authorization header
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let authHeader = req.headers.authorization as string | undefined;

    // Support token via query param (e.g., SSE EventSource which cannot set headers)
    if (!authHeader && req.query && (req.query.token as string)) {
      authHeader = `Bearer ${req.query.token as string}`;
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "No authentication token provided",
      });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const auth = getAuth();

    // Verify token
    const decodedToken = await auth.verifyIdToken(idToken);

    // Get user data from Firestore
    const user = await authService.getUserById(decodedToken.uid);

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User account is inactive or does not exist",
      });
    }

    // Attach user info to request (using AuthUser type)
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: user.role,
      organizationId: user.organizationId,
    } as AuthUser;

    // Attach detailed user data to request
    req.userData = {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role as UserRole,
      permissions: user.permissions,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}

/**
 * Authorize based on user role
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userData) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    if (!allowedRoles.includes(req.userData.role)) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You do not have permission to access this resource",
      });
    }

    next();
  };
}

/**
 * Check specific permission
 */
export function requirePermission(permission: keyof User["permissions"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userData) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "User not authenticated",
      });
    }

    if (!req.userData.permissions[permission]) {
      return res.status(403).json({
        error: "Forbidden",
        message: `You do not have permission to ${permission}`,
      });
    }

    next();
  };
}

/**
 * Ensure user belongs to same organization
 */
export function sameOrganization(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { organizationId } = req.params;

  if (!req.userData) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "User not authenticated",
    });
  }

  if (req.userData.organizationId !== organizationId) {
    return res.status(403).json({
      error: "Forbidden",
      message: "You can only access resources from your organization",
    });
  }

  next();
}

/**
 * Optional authentication - attach user if token exists but don't fail
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      req.user = decodedToken;

      const user = await authService.getUserById(decodedToken.uid);
      if (user && user.isActive) {
        req.userData = {
          id: user.id,
          organizationId: user.organizationId,
          role: user.role as UserRole,
          permissions: user.permissions,
        };
      }
    }

    next();
  } catch (_error) {
    // Don't fail, just proceed without user
    next();
  }
}
