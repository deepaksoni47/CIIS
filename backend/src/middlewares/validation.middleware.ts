import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";

/**
 * Middleware to check validation results and return errors
 */
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation Error",
      message: "Invalid request data",
      details: errors.array().map((err) => ({
        field: err.type === "field" ? err.path : undefined,
        message: err.msg,
        value: err.type === "field" ? err.value : undefined,
      })),
    });
    return;
  }

  next();
};

/**
 * Common validation rules
 */

// Email validation
export const validateEmail = body("email")
  .trim()
  .isEmail()
  .withMessage("Invalid email address")
  .normalizeEmail()
  .isLength({ max: 255 })
  .withMessage("Email must not exceed 255 characters");

// Password validation
export const validatePassword = body("password")
  .isString()
  .withMessage("Password must be a string")
  .isLength({ min: 8, max: 128 })
  .withMessage("Password must be between 8 and 128 characters")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/\d/)
  .withMessage("Password must contain at least one number")
  .matches(/[@$!%*?&#]/)
  .withMessage(
    "Password must contain at least one special character (@$!%*?&#)"
  );

// Phone number validation
export const validatePhone = body("phone")
  .optional()
  .trim()
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage("Invalid phone number format (E.164)");

// MongoDB/Firestore ID validation
export const validateId = (field: string = "id") =>
  param(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .isLength({ min: 1, max: 128 })
    .withMessage(`${field} must be between 1 and 128 characters`);

// Organization ID validation
export const validateOrganizationId = body("organizationId")
  .trim()
  .notEmpty()
  .withMessage("Organization ID is required")
  .isLength({ min: 1, max: 128 })
  .withMessage("Organization ID must be between 1 and 128 characters");

// User role validation
export const validateUserRole = body("role")
  .isIn(["student", "faculty", "staff", "facility_manager", "admin"])
  .withMessage("Invalid user role");

/**
 * Issue validation rules
 */
export const validateIssueCreation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters")
    .matches(/^[a-zA-Z0-9\s\-.,!?()'":/@#]+$/)
    .withMessage("Title contains invalid characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("category")
    .optional()
    .isIn([
      "Structural",
      "Electrical",
      "Plumbing",
      "HVAC",
      "Safety",
      "Maintenance",
      "Cleanliness",
      "Network",
      "Furniture",
      "Other",
    ])
    .withMessage("Invalid category"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority"),

  body("latitude")
    .notEmpty()
    .withMessage("Latitude is required")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude (must be between -90 and 90)")
    .customSanitizer((value) => {
      // Convert string to float if needed
      return typeof value === "string" ? parseFloat(value) : value;
    }),

  body("longitude")
    .notEmpty()
    .withMessage("Longitude is required")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude (must be between -180 and 180)")
    .customSanitizer((value) => {
      // Convert string to float if needed
      return typeof value === "string" ? parseFloat(value) : value;
    }),

  body("buildingId")
    .trim()
    .notEmpty()
    .withMessage("Building ID is required")
    .isLength({ max: 128 })
    .withMessage("Building ID must not exceed 128 characters"),

  body("organizationId")
    .trim()
    .notEmpty()
    .withMessage("Organization ID is required")
    .isLength({ max: 128 })
    .withMessage("Organization ID must not exceed 128 characters"),

  body("images")
    .optional()
    .isArray({ max: 10 })
    .withMessage("Maximum 10 images allowed"),

  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),

  handleValidationErrors,
];

/**
 * Issue update validation rules
 */
export const validateIssueUpdate = [
  param("id").trim().notEmpty().withMessage("Issue ID is required"),

  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),

  body("category")
    .optional()
    .isIn([
      "Structural",
      "Electrical",
      "Plumbing",
      "HVAC",
      "Safety",
      "Maintenance",
      "Cleanliness",
      "Network",
      "Furniture",
      "Other",
    ])
    .withMessage("Invalid category"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "critical"])
    .withMessage("Invalid priority"),

  body("status")
    .optional()
    .isIn(["open", "in_progress", "resolved", "closed"])
    .withMessage("Invalid status"),

  handleValidationErrors,
];

/**
 * Heatmap query validation
 */
export const validateHeatmapQuery = [
  query("organizationId")
    .trim()
    .notEmpty()
    .withMessage("Organization ID is required"),

  query("campusId")
    .optional()
    .trim()
    .isLength({ max: 128 })
    .withMessage("Campus ID must not exceed 128 characters"),

  query("categories")
    .optional()
    .customSanitizer((value) => {
      if (typeof value === "string") {
        return value.split(",").map((c) => c.trim());
      }
      return value;
    }),

  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date"),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date"),

  query("decayFactor")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Decay factor must be between 0 and 1"),

  query("minSeverity")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("Min severity must be between 0 and 10"),

  handleValidationErrors,
];

/**
 * Pagination validation
 */
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("Page must be between 1 and 10000")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),

  handleValidationErrors,
];

/**
 * Search query validation
 */
export const validateSearchQuery = [
  query("q")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Search query must be between 1 and 200 characters")
    .matches(/^[a-zA-Z0-9\s\-.,!?()]+$/)
    .withMessage("Search query contains invalid characters"),

  handleValidationErrors,
];

/**
 * Date range validation
 */
export const validateDateRange = [
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO 8601 date")
    .custom((value, { req }) => {
      if (
        req.query &&
        req.query.endDate &&
        new Date(value) > new Date(req.query.endDate as string)
      ) {
        throw new Error("Start date must be before end date");
      }
      return true;
    }),

  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO 8601 date")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("End date cannot be in the future");
      }
      return true;
    }),

  handleValidationErrors,
];

/**
 * Coordinates validation
 */
export const validateCoordinates = [
  query("lat")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  query("lng")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  query("radius")
    .optional()
    .isFloat({ min: 0, max: 50000 })
    .withMessage("Radius must be between 0 and 50000 meters"),

  handleValidationErrors,
];

/**
 * Sanitize HTML content to prevent XSS
 */
export const sanitizeHtml = (field: string) =>
  body(field)
    .trim()
    .escape()
    .customSanitizer((value) => {
      // Remove any HTML tags
      return value.replace(/<[^>]*>/g, "");
    });

/**
 * Validate array of IDs
 */
export const validateIdArray = (field: string, maxLength: number = 100) => [
  body(field)
    .optional()
    .isArray({ max: maxLength })
    .withMessage(`${field} must be an array with maximum ${maxLength} items`),

  body(`${field}.*`)
    .trim()
    .notEmpty()
    .withMessage(`Each item in ${field} must not be empty`)
    .isLength({ max: 128 })
    .withMessage(`Each item in ${field} must not exceed 128 characters`),
];

/**
 * Validate priority engine input
 */
export const validatePriorityInput = [
  body("severity")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("Severity must be between 0 and 10"),

  body("occupancy")
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage("Occupancy must be between 0 and 10000"),

  body("affectedArea")
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage("Affected area must be between 0 and 1000000 square meters"),

  body("blocksAccess")
    .optional()
    .isBoolean()
    .withMessage("blocksAccess must be a boolean"),

  body("safetyRisk")
    .optional()
    .isBoolean()
    .withMessage("safetyRisk must be a boolean"),

  handleValidationErrors,
];

/**
 * Custom validator: Check if value is a valid GeoPoint
 */
export const validateGeoPoint = (field: string) =>
  body(field).custom((value) => {
    if (!value || typeof value !== "object") {
      throw new Error(`${field} must be an object`);
    }
    if (typeof value.lat !== "number" || value.lat < -90 || value.lat > 90) {
      throw new Error(`${field}.lat must be a number between -90 and 90`);
    }
    if (typeof value.lng !== "number" || value.lng < -180 || value.lng > 180) {
      throw new Error(`${field}.lng must be a number between -180 and 180`);
    }
    return true;
  });

/**
 * Validate file upload metadata
 */
export const validateUploadMetadata = [
  body("fileName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage("File name must be between 1 and 255 characters")
    .matches(/^[a-zA-Z0-9\s\-_.()]+$/)
    .withMessage("File name contains invalid characters"),

  body("fileType")
    .optional()
    .isIn([
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
    ])
    .withMessage("Invalid file type"),

  handleValidationErrors,
];

/**
 * Validate real-time query parameters
 */
export const validateRealtimeQuery = [
  query("organizationId")
    .trim()
    .notEmpty()
    .withMessage("Organization ID is required"),

  query("updateInterval")
    .optional()
    .isInt({ min: 5000, max: 300000 })
    .withMessage("Update interval must be between 5000 and 300000 milliseconds")
    .toInt(),

  handleValidationErrors,
];
