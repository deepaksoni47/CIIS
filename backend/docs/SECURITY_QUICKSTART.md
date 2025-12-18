# Security Quick Start Guide

Quick reference for developers working with the CIIS backend security features.

## 🚀 Quick Start

### Using Security Middleware

#### 1. Rate Limiting

```typescript
import {
  apiRateLimiter,
  authRateLimiter,
  uploadRateLimiter,
} from "../../middlewares/rateLimiter.middleware";

// General API endpoint
router.get("/data", authenticate, apiRateLimiter, controller.getData);

// Authentication endpoint
router.post("/login", authRateLimiter, controller.login);

// Upload endpoint
router.post("/upload", authenticate, uploadRateLimiter, controller.upload);
```

#### 2. Input Validation

```typescript
import {
  validateIssueCreation,
  validateId,
  handleValidationErrors,
} from "../../middlewares/validation.middleware";
import { body } from "express-validator";

// Using pre-built validators
router.post(
  "/issues",
  authenticate,
  validateIssueCreation,
  controller.createIssue
);

// Custom validation
router.post(
  "/custom",
  authenticate,
  body("email").isEmail().normalizeEmail(),
  body("age").isInt({ min: 0, max: 120 }),
  handleValidationErrors,
  controller.custom
);
```

#### 3. File Upload

```typescript
import {
  uploadImage,
  handleUploadErrors,
  validateUploadedFiles,
  validateFileContent,
} from "../../middlewares/upload.middleware";

// Complete upload pipeline
router.post(
  "/upload-image",
  authenticate,
  uploadRateLimiter,
  uploadImage.array("images", 10),
  handleUploadErrors,
  validateUploadedFiles,
  validateFileContent,
  controller.uploadImage
);
```

## 📋 Common Patterns

### Protected Route with Validation

```typescript
router.post(
  "/issues",
  authenticate, // Check JWT token
  authorize(UserRole.FACULTY), // Check role
  issueCreationRateLimiter, // Rate limit (20/hour)
  validateIssueCreation, // Validate input
  issuesController.createIssue // Handle request
);
```

### Public Route with Rate Limiting

```typescript
router.get(
  "/insights",
  aiRateLimiter, // Rate limit (50/hour)
  aiController.getInsights // Handle request
);
```

### Upload Route

```typescript
router.post(
  "/upload",
  authenticate, // Check JWT token
  uploadRateLimiter, // Rate limit (30/hour)
  uploadImage.array("images", 10), // Accept up to 10 images
  handleUploadErrors, // Handle multer errors
  validateUploadedFiles, // Validate files
  validateFileContent, // Verify content
  controller.handleUpload // Handle request
);
```

### Query Parameter Validation

```typescript
router.get(
  "/heatmap",
  authenticate, // Check JWT token
  apiRateLimiter, // Rate limit
  validateHeatmapQuery, // Validate query params
  heatmapController.getHeatmap // Handle request
);
```

## 🛡️ Available Rate Limiters

| Limiter                    | Limit | Window | Use For               |
| -------------------------- | ----- | ------ | --------------------- |
| `authRateLimiter`          | 5     | 15 min | Login, registration   |
| `apiRateLimiter`           | 100   | 15 min | General API endpoints |
| `issueCreationRateLimiter` | 20    | 1 hour | Issue creation        |
| `aiRateLimiter`            | 50    | 1 hour | AI operations         |
| `uploadRateLimiter`        | 30    | 1 hour | File uploads          |
| `realtimeRateLimiter`      | 10    | 1 min  | SSE/WebSocket         |
| `globalRateLimiter`        | 1000  | 15 min | Fallback              |

## ✅ Available Validators

### Common

- `validateEmail` - Email format
- `validatePassword` - Strong password
- `validatePhone` - E.164 phone format
- `validateId(field)` - ID validation

### Issues

- `validateIssueCreation` - New issue validation
- `validateIssueUpdate` - Issue update validation

### Queries

- `validateHeatmapQuery` - Heatmap query params
- `validatePagination` - Page/limit params
- `validateSearchQuery` - Search query
- `validateCoordinates` - Lat/lng/radius
- `validateDateRange` - Start/end dates

### Priority

- `validatePriorityInput` - Priority calculation

### Realtime

- `validateRealtimeQuery` - SSE query params

### Upload

- `validateUploadMetadata` - File metadata
- `validateFileContent` - File content verification

## 📁 File Upload Types

### Images

```typescript
import { uploadImage } from "../../middlewares/upload.middleware";

// Single image
uploadImage.single("image");

// Multiple images (max 10)
uploadImage.array("images", 10);

// Multiple fields
uploadImage.fields([
  { name: "avatar", maxCount: 1 },
  { name: "photos", maxCount: 5 },
]);
```

### Audio

```typescript
import { uploadAudio } from "../../middlewares/upload.middleware";

uploadAudio.single("audio");
```

### Video

```typescript
import { uploadVideo } from "../../middlewares/upload.middleware";

uploadVideo.single("video");
```

### Mixed

```typescript
import { uploadMixedMedia } from "../../middlewares/upload.middleware";

uploadMixedMedia.fields([
  { name: "images", maxCount: 10 },
  { name: "audio", maxCount: 1 },
]);
```

## 🔒 Security Utilities

### Sanitization

```typescript
import {
  sanitizeInput,
  sanitizeHtml,
  sanitizeObject,
} from "../utils/security.utils";

// Escape HTML characters
const safe = sanitizeInput(userInput);

// Remove HTML tags
const clean = sanitizeHtml(userInput);

// Recursively sanitize object
const cleanObj = sanitizeObject(userData);
```

### Validation

```typescript
import { isValidEmail, isValidURL, isValidIP } from "../utils/security.utils";

if (isValidEmail(email)) {
  // Process email
}

if (isValidURL(url)) {
  // Process URL
}

if (isValidIP(ip)) {
  // Process IP
}
```

### Cryptography

```typescript
import {
  generateSecureToken,
  hashValue,
  compareHash,
} from "../utils/security.utils";

// Generate token
const token = generateSecureToken(32);

// Hash value
const hash = hashValue("sensitive-data");

// Compare (timing-safe)
const match = compareHash(hash, "sensitive-data");
```

## 🧪 Testing Examples

### Test Rate Limiting

```bash
# Should return 429 after 5 attempts
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"idToken":"test"}'
done
```

### Test Validation

```bash
# Should return 400 with validation errors
curl -X POST http://localhost:3000/api/issues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "ab",
    "description": "short"
  }'
```

### Test File Upload

```bash
# Valid upload
curl -X POST http://localhost:3000/api/issues/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "images=@test.jpg"

# Invalid file type (should fail)
curl -X POST http://localhost:3000/api/issues/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "images=@test.exe"
```

## ❌ Common Errors

### 400 Bad Request

**Cause**: Validation failed
**Solution**: Check request body matches validation rules

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized

**Cause**: Missing or invalid token
**Solution**: Include valid Firebase token in Authorization header

```http
Authorization: Bearer <firebase-id-token>
```

### 413 Payload Too Large

**Cause**: File too large
**Solution**: Reduce file size (images: 5MB, audio: 10MB, video: 50MB)

### 429 Too Many Requests

**Cause**: Rate limit exceeded
**Solution**: Wait and retry, implement exponential backoff

```json
{
  "error": "Too many requests",
  "retryAfter": 900
}
```

## 📊 Debugging

### Check Rate Limit Headers

```bash
curl -I http://localhost:3000/api/issues \
  -H "Authorization: Bearer <token>"

# Look for:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 95
# X-RateLimit-Reset: 1640000000
```

### Check Request ID

```bash
curl -I http://localhost:3000/api/issues \
  -H "Authorization: Bearer <token>"

# Look for:
# X-Request-ID: 123e4567-e89b-12d3-a456-426614174000
```

### View Validation Errors

```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' \
  | jq '.errors'
```

## 🎯 Best Practices

### 1. Always Use HTTPS

```typescript
// In production, enforce HTTPS
if (process.env.NODE_ENV === "production") {
  app.use(enforceHTTPS);
}
```

### 2. Validate All Input

```typescript
// Never trust user input
router.post(
  "/data",
  authenticate,
  validateInput, // Always validate
  controller.handleData
);
```

### 3. Sanitize Output

```typescript
// Clean data before sending
const cleanData = sanitizeObject(userData);
res.json(cleanData);
```

### 4. Use Rate Limiting

```typescript
// Protect all endpoints
router.get(
  "/data",
  authenticate,
  apiRateLimiter, // Always rate limit
  controller.getData
);
```

### 5. Handle Errors Gracefully

```typescript
try {
  // Process request
} catch (error) {
  console.error("Error:", error);
  res.status(500).json({
    error: "Internal server error",
    // Don't expose error details to clients
  });
}
```

## 📚 Additional Resources

- [SECURITY.md](../SECURITY.md) - Comprehensive security documentation
- [API_SECURITY.md](./API_SECURITY.md) - API security reference
- [Express Validator Docs](https://express-validator.github.io/docs/)
- [Express Rate Limit Docs](https://github.com/express-rate-limit/express-rate-limit)
- [Multer Docs](https://github.com/expressjs/multer)

## 🆘 Support

For security questions:

- Review documentation first
- Check existing issues
- Contact security team

**Never publicly disclose security vulnerabilities!**

---

_Last updated: January 2025_
