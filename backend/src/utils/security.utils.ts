import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Security utility functions
 */

/**
 * Generate a secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Hash a value using SHA-256
 */
export function hashValue(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/**
 * Compare hash with value (timing-safe)
 */
export function compareHash(hash: string, value: string): boolean {
  const valueHash = hashValue(value);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(valueHash));
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validate IP address
 */
export function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"] as string;
  const realIP = req.headers["x-real-ip"] as string;

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first
    const ips = forwarded.split(",").map((ip) => ip.trim());
    return ips[0];
  }

  if (realIP) {
    return realIP;
  }

  return req.socket.remoteAddress || req.ip || "unknown";
}

/**
 * Middleware to add security headers
 */
export function securityHeaders(
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Enable XSS protection
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions policy
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(self), microphone=(self), camera=(self)"
  );

  next();
}

/**
 * Middleware to prevent common attacks
 */
export function preventCommonAttacks(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(--|\||;|\/\*|\*\/|xp_|sp_)/i,
  ];

  // Check for XSS patterns
  const xssPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /on\w+\s*=\s*["'][^"']*["']/gi,
    /javascript:/gi,
  ];

  // Check for path traversal
  const pathTraversalPatterns = [
    /\.\.\//g,
    /\.\.\\/g,
    /%2e%2e%2f/gi,
    /%2e%2e\\/gi,
  ];

  const checkString = (str: string): boolean => {
    // Check SQL injection
    if (sqlInjectionPatterns.some((pattern) => pattern.test(str))) {
      return false;
    }

    // Check XSS
    if (xssPatterns.some((pattern) => pattern.test(str))) {
      return false;
    }

    // Check path traversal
    if (pathTraversalPatterns.some((pattern) => pattern.test(str))) {
      return false;
    }

    return true;
  };

  const checkObject = (obj: Record<string, unknown>): boolean => {
    for (const key in obj) {
      const value = obj[key];

      if (typeof value === "string") {
        if (!checkString(value)) {
          return false;
        }
      } else if (typeof value === "object" && value !== null) {
        if (!checkObject(value as Record<string, unknown>)) {
          return false;
        }
      }
    }

    return true;
  };

  try {
    // Check URL
    if (!checkString(req.url)) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid characters detected in URL",
      });
      return;
    }

    // Check query parameters
    if (req.query && !checkObject(req.query)) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid characters detected in query parameters",
      });
      return;
    }

    // Check body
    if (req.body && !checkObject(req.body)) {
      res.status(400).json({
        error: "Bad Request",
        message: "Invalid characters detected in request body",
      });
      return;
    }

    next();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    res.status(500).json({
      error: "Internal Server Error",
      message: "Security validation failed",
    });
  }
}

/**
 * Middleware to log suspicious activity
 */
export function logSuspiciousActivity(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const suspiciousPatterns = [
    /admin/i,
    /root/i,
    /wp-admin/i,
    /phpMyAdmin/i,
    /\.env/i,
    /\.git/i,
    /config/i,
    /backup/i,
  ];

  const url = req.url.toLowerCase();
  const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(url));

  if (isSuspicious) {
    console.warn(`⚠️  Suspicious request detected:`, {
      ip: getClientIP(req),
      method: req.method,
      url: req.url,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Middleware to enforce HTTPS in production
 */
export function enforceHTTPS(req: Request, res: Response, next: NextFunction) {
  if (
    process.env.NODE_ENV === "production" &&
    req.headers["x-forwarded-proto"] !== "https"
  ) {
    return res.redirect(301, `https://${req.hostname}${req.url}`);
  }

  next();
}

/**
 * Generate CSRF token
 */
export function generateCSRFToken(): string {
  return generateSecureToken(32);
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(
  token: string,
  sessionToken: string
): boolean {
  if (!token || !sessionToken) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(sessionToken));
}

/**
 * Middleware to validate request origin
 */
export function validateOrigin(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;

    if (!origin) {
      // No origin header (same-origin request or non-browser client)
      return next();
    }

    if (allowedOrigins.includes(origin)) {
      return next();
    }

    return res.status(403).json({
      error: "Forbidden",
      message: "Origin not allowed",
    });
  };
}

/**
 * Middleware to detect and block bots (basic)
 */
export function detectBot(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const userAgent = req.headers["user-agent"] || "";

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
  ];

  const isBot = botPatterns.some((pattern) => pattern.test(userAgent));

  if (isBot) {
    console.warn(`🤖 Bot detected:`, {
      ip: getClientIP(req),
      userAgent,
      url: req.url,
    });

    // You can choose to block bots or just log them
    // return res.status(403).json({ error: 'Bots not allowed' });
  }

  next();
}

/**
 * Middleware to add request ID for tracking
 */
export function addRequestId(req: Request, res: Response, next: NextFunction) {
  const requestId =
    (req.headers["x-request-id"] as string) || generateSecureToken(16);
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) {
    if (typeof obj === "string") {
      return sanitizeInput(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }

  const sanitized: Record<string, unknown> = {};
  const objRecord = obj as Record<string, unknown>;
  for (const key in objRecord) {
    if (Object.prototype.hasOwnProperty.call(objRecord, key)) {
      sanitized[key] = sanitizeObject(objRecord[key]);
    }
  }

  return sanitized;
}

/**
 * Validate email format (additional security check)
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  // Check length
  if (email.length > 255) return false;

  // Check format
  if (!emailRegex.test(email)) return false;

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /\.\./, // Double dots
    /^\./, // Starts with dot
    /\.$/, // Ends with dot
  ];

  return !suspiciousPatterns.some((pattern) => pattern.test(email));
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    // eslint-disable-next-line no-undef
    const parsed = new URL(url);

    // Only allow http and https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /file:/i,
    ];

    return !suspiciousPatterns.some((pattern) => pattern.test(url));
  } catch {
    return false;
  }
}

/**
 * Rate limit key generator based on multiple factors
 */
export function generateRateLimitKey(req: Request): string {
  const userId = req.userData?.id || "";
  const ip = getClientIP(req);
  const path = req.path;

  return hashValue(`${userId}:${ip}:${path}`);
}
