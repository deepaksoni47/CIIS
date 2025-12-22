import { Request, Response, NextFunction } from "express";
import { getAuth } from "../config/firebase";
import { getFirestore, COLLECTIONS } from "../config/firebase";

const auth = getAuth();
const db = getFirestore();

// Custom user type for authenticated requests
export interface AuthUser {
  uid: string;
  email?: string;
  role?: string;
  organizationId?: string;
}

// Extend Express Request type
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

/**
 * Authenticate user from Firebase ID token
 */
export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "No authentication token provided",
      });
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Get user data from Firestore
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User profile not found in database",
      });
    }

    const userData = userDoc.data();

    // Attach user info to request
    req.user = {
      uid,
      email: decodedToken.email,
      role: userData?.role || "student",
      organizationId: userData?.organizationId,
    } as AuthUser;

    next();
  } catch (error: any) {
    console.error("Authentication error:", error);
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Invalid or expired token",
    });
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Admin access required",
    });
  }

  next();
}

/**
 * Require facility manager or admin role
 */
export function requireFacilityManager(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      message: "Authentication required",
    });
  }

  if (req.user.role !== "facility_manager" && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: "Forbidden",
      message: "Facility manager or admin access required",
    });
  }

  next();
}
