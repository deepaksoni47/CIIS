import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * Rate limiting configuration for different endpoint types
 */

// Strict rate limit for authentication endpoints (prevent brute force)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: "Too Many Requests",
    message:
      "Too many authentication attempts. Please try again after 15 minutes.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests (only count failed attempts)
  skip: (_req: Request, res: Response) => res.statusCode < 400,
  keyGenerator: (req: Request): string => {
    // Use IP + user identifier for more accurate rate limiting
    return (req.ip || "unknown") + (req.body?.email || req.body?.phone || "");
  },
});

// Moderate rate limit for general API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: "Too Many Requests",
    message: "Too many requests from this IP. Please try again later.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    // Use authenticated user ID if available, otherwise IP
    return req.userData?.id || req.ip || "unknown";
  },
});

// Strict rate limit for issue creation (prevent spam)
export const issueCreationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 issues per hour
  message: {
    error: "Too Many Requests",
    message: "You have created too many issues. Please try again after 1 hour.",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.userData?.id || req.ip || "unknown";
  },
});

// Rate limit for AI endpoints (more expensive operations)
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 AI requests per hour
  message: {
    error: "Too Many Requests",
    message: "AI service rate limit exceeded. Please try again later.",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.userData?.id || req.ip || "unknown";
  },
});

// Rate limit for file uploads
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 uploads per hour
  message: {
    error: "Too Many Requests",
    message: "Upload limit exceeded. Please try again after 1 hour.",
    retryAfter: 60 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.userData?.id || req.ip || "unknown";
  },
});

// Relaxed rate limit for real-time endpoints (SSE/WebSocket)
export const realtimeRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 connection attempts per minute
  message: {
    error: "Too Many Requests",
    message: "Too many real-time connection attempts. Please wait a moment.",
    retryAfter: 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.userData?.id || req.ip || "unknown";
  },
});

// Global fallback rate limiter (very permissive)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window
  message: {
    error: "Too Many Requests",
    message: "Rate limit exceeded. Please slow down.",
    retryAfter: 15 * 60,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom rate limiter for dynamic limits based on user role
 */
export const createDynamicRateLimiter = (options: {
  studentMax: number;
  facultyMax: number;
  staffMax: number;
  adminMax: number;
  windowMs: number;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: (req: Request) => {
      const role = req.userData?.role;
      switch (role) {
        case "admin":
        case "facility_manager":
          return options.adminMax;
        case "staff":
          return options.staffMax;
        case "faculty":
          return options.facultyMax;
        case "student":
        default:
          return options.studentMax;
      }
    },
    message: {
      error: "Too Many Requests",
      message: "Rate limit exceeded for your user role.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request): string => {
      return req.userData?.id || req.ip || "unknown";
    },
  });
};

/**
 * Middleware to add rate limit info to response headers
 */
export const addRateLimitInfo = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("X-RateLimit-Policy", "standard");
  next();
};
