# Security Documentation

## Overview

This document describes the comprehensive security measures implemented in the CIIS backend system. Our security architecture follows defense-in-depth principles with multiple layers of protection.

## Table of Contents

- [Security Architecture](#security-architecture)
- [Rate Limiting](#rate-limiting)
- [Input Validation](#input-validation)
- [File Upload Security](#file-upload-security)
- [Attack Prevention](#attack-prevention)
- [Security Headers](#security-headers)
- [Authentication & Authorization](#authentication--authorization)
- [Monitoring & Logging](#monitoring--logging)
- [Best Practices](#best-practices)
- [Security Testing](#security-testing)

---

## Security Architecture

### Defense-in-Depth Layers

1. **Network Layer**: HTTPS enforcement, CORS policies
2. **Application Layer**: Rate limiting, input validation
3. **Data Layer**: Sanitization, SQL/XSS prevention
4. **Upload Layer**: File type/size validation, content verification
5. **Authentication Layer**: JWT tokens, role-based access control

### Middleware Chain Order

Security middleware is applied in a specific order (see `src/index.ts`):

1. **Request ID** - Tracking and correlation
2. **HTTPS Enforcement** - Redirect HTTP to HTTPS in production
3. **Helmet** - Basic security headers
4. **Custom Security Headers** - Additional hardening
5. **CORS** - Cross-origin resource sharing
6. **Suspicious Activity Logging** - Attack detection
7. **Common Attack Prevention** - SQL injection, XSS, path traversal
8. **Global Rate Limiting** - API abuse prevention
9. **Body Parsers** - Request parsing with size limits
10. **Compression** - Response optimization

---

## Rate Limiting

### Overview

Rate limiting prevents API abuse, brute force attacks, and DDoS attempts. We use multiple specialized rate limiters based on endpoint sensitivity.

### Rate Limiters

#### 1. Authentication Rate Limiter

```typescript
authRateLimiter;
```

- **Limit**: 5 requests per 15 minutes
- **Use Cases**: Login, registration
- **Purpose**: Prevent brute force attacks
- **Special**: Skips limit on successful authentication

#### 2. API Rate Limiter

```typescript
apiRateLimiter;
```

- **Limit**: 100 requests per 15 minutes
- **Use Cases**: General API endpoints
- **Purpose**: Prevent API abuse

#### 3. Issue Creation Rate Limiter

```typescript
issueCreationRateLimiter;
```

- **Limit**: 20 issues per hour
- **Use Cases**: Issue creation endpoints
- **Purpose**: Prevent spam and abuse

#### 4. AI Rate Limiter

```typescript
aiRateLimiter;
```

- **Limit**: 50 requests per hour
- **Use Cases**: AI endpoints (insights, chat, summaries)
- **Purpose**: Control expensive AI operations

#### 5. Upload Rate Limiter

```typescript
uploadRateLimiter;
```

- **Limit**: 30 uploads per hour
- **Use Cases**: File upload endpoints
- **Purpose**: Prevent storage abuse

#### 6. Realtime Rate Limiter

```typescript
realtimeRateLimiter;
```

- **Limit**: 10 connections per minute
- **Use Cases**: SSE/WebSocket connections
- **Purpose**: Prevent connection flooding

#### 7. Global Rate Limiter

```typescript
globalRateLimiter;
```

- **Limit**: 1000 requests per 15 minutes
- **Use Cases**: Fallback for all endpoints
- **Purpose**: Overall API protection

### Dynamic Rate Limiting

Role-based rate limits can be created dynamically:

```typescript
const adminLimiter = createDynamicRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: "Admin rate limit exceeded",
});
```

### Rate Limit Headers

Standard headers are returned with every request:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Time when limit resets

### Key Generation

Rate limits are tracked per:

- **Authenticated users**: `userId:IP:path`
- **Anonymous users**: `IP:path`

This prevents circumvention through multiple accounts.

---

## Input Validation

### Overview

All user input is validated using express-validator with a whitelist approach (deny by default, allow only known-good patterns).

### Common Validators

#### Email Validation

```typescript
validateEmail;
```

- Format: RFC 5322 compliant
- Normalization: Lowercase, trimmed
- Suspicious patterns: No consecutive dots, no leading/trailing dots

#### Password Validation

```typescript
validatePassword;
```

- Length: 8-128 characters
- Requirements:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%\*?&#)

#### Phone Validation

```typescript
validatePhone;
```

- Format: E.164 international format
- Example: +14155552671

#### ID Validation

```typescript
validateId("paramName");
```

- Length: 1-128 characters
- Characters: Alphanumeric, hyphens, underscores only

### Issue Validators

#### Issue Creation

```typescript
validateIssueCreation;
```

- **title**: 5-200 characters, safe characters only
- **description**: 10-2000 characters
- **category**: Enum validation (PLUMBING, ELECTRICAL, HVAC, etc.)
- **location**: Coordinate validation
- **building_id**: Required ID
- **organization_id**: Required ID
- **images**: Optional array, max 10 items

#### Issue Update

```typescript
validateIssueUpdate;
```

- All fields optional
- Same validation rules as creation
- Partial updates supported

### Query Validators

#### Heatmap Query

```typescript
validateHeatmapQuery;
```

- **organizationId**: Required ID
- **campusId**: Optional ID
- **categories**: Optional array
- **startDate/endDate**: ISO 8601 format
- **minSeverity**: 0-10
- **timeDecayFactor**: 0-1

#### Pagination

```typescript
validatePagination;
```

- **page**: 1-10000
- **limit**: 1-100

#### Search Query

```typescript
validateSearchQuery;
```

- **query**: 1-200 characters
- **characters**: Safe characters only (alphanumeric, spaces, basic punctuation)

#### Coordinates

```typescript
validateCoordinates;
```

- **latitude**: -90 to 90
- **longitude**: -180 to 180
- **radius**: 0-50000 meters

### Priority Validators

```typescript
validatePriorityInput;
```

- **severity**: 0-10 scale
- **occupancyImpact**: 0-100 percentage
- **affectedArea**: 0-100000 square meters

### Realtime Query Validators

```typescript
validateRealtimeQuery;
```

- **organizationId**: Required ID
- **updateInterval**: 5000-300000 milliseconds (5s-5min)

### Sanitization

All text input is sanitized to prevent XSS attacks:

```typescript
sanitizeHtml(input); // Removes HTML tags
sanitizeInput(input); // Escapes dangerous characters
sanitizeObject(obj); // Recursively sanitizes nested objects
```

---

## File Upload Security

### Overview

File uploads are secured through multiple validation layers: MIME type checking, extension validation, magic number verification, and content inspection.

### Allowed File Types

#### Images

- **Types**: jpeg, jpg, png, gif, webp
- **MIME Types**: image/jpeg, image/png, image/gif, image/webp
- **Max Size**: 5MB per image
- **Magic Numbers**:
  - JPEG: `0xFFD8FF`
  - PNG: `0x89504E47`
  - GIF: `0x47494638`
  - WebP: `WEBP` at offset 8

#### Audio

- **Types**: mp3, mpeg, wav, webm, ogg
- **MIME Types**: audio/mpeg, audio/wav, audio/webm, audio/ogg
- **Max Size**: 10MB per file
- **Magic Numbers**:
  - MP3: ID3 tag or `0xFFFB`
  - WAV: `RIFF`
  - OGG: `OggS`

#### Video

- **Types**: mp4, webm, ogg
- **MIME Types**: video/mp4, video/webm, video/ogg
- **Max Size**: 50MB per file

### Upload Limits

- **Max files per upload**: 10
- **Total upload size**: Sum of all files must not exceed category limit

### Multer Configurations

#### Image Upload

```typescript
uploadImage.array("images", 10);
```

- Multiple images (max 10)
- Memory storage for processing

#### Audio Upload

```typescript
uploadAudio.single("audio");
```

- Single audio file
- Validation on upload

#### Video Upload

```typescript
uploadVideo.single("video");
```

- Single video file
- Large file handling

#### Mixed Media Upload

```typescript
uploadMixedMedia.fields([
  { name: "images", maxCount: 10 },
  { name: "audio", maxCount: 1 },
]);
```

- Combined image + audio uploads

### Security Validations

#### 1. MIME Type Check

```typescript
isAllowedFileType(mimetype, allowedTypes);
```

- Validates declared MIME type against whitelist

#### 2. Extension Check

```typescript
isAllowedExtension(filename, allowedExtensions);
```

- Validates file extension against whitelist

#### 3. Magic Number Validation

```typescript
isValidImage(buffer);
isValidAudio(buffer);
```

- Reads first bytes of file to verify actual type
- Prevents MIME type spoofing

#### 4. Content Validation

```typescript
validateFileContent(buffer, mimetype);
```

- Verifies file content matches declared type
- Blocks malicious files with fake extensions

#### 5. Filename Sanitization

```typescript
sanitizeFilename(filename);
```

- Removes path traversal characters (`..`, `~`)
- Removes unsafe characters
- Limits filename length to 100 characters

#### 6. Unique Filename Generation

```typescript
generateUniqueFilename(originalname);
```

- Format: `timestamp-random.ext`
- Prevents filename collisions

### Error Handling

Specific error messages for each upload error:

- `LIMIT_FILE_SIZE`: File exceeds size limit
- `LIMIT_FILE_COUNT`: Too many files
- `LIMIT_UNEXPECTED_FILE`: Unexpected field name
- `UNSUPPORTED_FILE_TYPE`: File type not allowed

### Usage Example

```typescript
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

---

## Attack Prevention

### SQL Injection Prevention

#### Detection Patterns

- `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- `DROP`, `CREATE`, `ALTER`
- SQL comments: `--`, `/*`, `*/`
- Union attacks: `UNION`, `||`

#### Prevention Methods

1. **Input validation**: Whitelist allowed characters
2. **Parameterized queries**: Always use Firebase query builders
3. **Attack detection**: Log and block suspicious patterns

### XSS Prevention

#### Detection Patterns

- Script tags: `<script>`, `</script>`
- Event handlers: `onclick=`, `onerror=`, `onload=`
- Iframe tags: `<iframe>`
- Data URLs: `javascript:`, `data:`

#### Prevention Methods

1. **Input sanitization**: Escape HTML characters
2. **Output encoding**: Sanitize before rendering
3. **Content Security Policy**: Restrict script sources
4. **Attack detection**: Block suspicious patterns

#### Sanitization Functions

```typescript
sanitizeInput(input);
// Escapes: < > " ' /

sanitizeHtml(input);
// Removes all HTML tags

sanitizeObject(data);
// Recursively sanitizes nested objects
```

### Path Traversal Prevention

#### Detection Patterns

- `../`, `..\\`
- `%2e%2e`, `%2f`, `%5c`
- `~`, `/etc/`, `/root/`

#### Prevention Methods

1. **Path validation**: Block traversal sequences
2. **Filename sanitization**: Remove unsafe characters
3. **Whitelist paths**: Only allow specific directories

### CSRF Protection

#### Token Generation

```typescript
generateCSRFToken();
```

- 32-byte secure random token
- Unique per session

#### Token Validation

```typescript
validateCSRFToken(token, expected);
```

- Timing-safe comparison
- Prevents timing attacks

### Bot Detection

Identifies automated traffic via user-agent patterns:

- `bot`, `crawler`, `spider`
- `scraper`, `curl`, `wget`

### Suspicious Activity Logging

Monitors access to sensitive paths:

- `/admin`, `/root`
- `/wp-admin`, `/phpmyadmin`
- `/.env`, `/.git`
- `/config`, `/backup`

---

## Security Headers

### Helmet Headers

Basic security headers provided by helmet:

- `X-DNS-Prefetch-Control`
- `X-Download-Options`
- `Strict-Transport-Security`

### Custom Security Headers

Additional headers for enhanced security:

#### X-Frame-Options

```
X-Frame-Options: DENY
```

Prevents clickjacking by blocking iframe embedding.

#### X-Content-Type-Options

```
X-Content-Type-Options: nosniff
```

Prevents MIME type sniffing attacks.

#### X-XSS-Protection

```
X-XSS-Protection: 1; mode=block
```

Enables browser XSS filtering.

#### Referrer-Policy

```
Referrer-Policy: strict-origin-when-cross-origin
```

Controls referrer information leakage.

#### Permissions-Policy

```
Permissions-Policy: geolocation=(self), microphone=(self), camera=(self)
```

Restricts browser feature access.

### HTTPS Enforcement

In production, all HTTP requests are redirected to HTTPS:

```typescript
enforceHTTPS(req, res, next);
```

- 301 permanent redirect
- Preserves request path and query

---

## Authentication & Authorization

### JWT Authentication

Tokens are verified using Firebase Admin SDK:

```typescript
authenticate(req, res, next);
```

- Validates Firebase ID token
- Extracts user information
- Attaches user to request object

### Role-Based Access Control

Authorization checks user roles:

```typescript
authorize(...roles);
```

- Supports multiple allowed roles
- Common roles:
  - `ADMIN`: Full system access
  - `FACILITY_MANAGER`: Organization management
  - `STAFF`: Limited management
  - `FACULTY`: Issue reporting
  - `STUDENT`: Issue reporting

### Token Requirements

All protected endpoints require:

- Valid Firebase ID token
- Token in Authorization header: `Bearer <token>`
- Non-expired token

---

## Monitoring & Logging

### Request Tracking

Every request receives a unique ID:

- Header: `X-Request-ID`
- Format: UUID v4
- Used for log correlation

### Security Event Logging

The following events are logged:

1. **Rate limit violations**
2. **Failed authentication attempts**
3. **Suspicious activity** (admin path access)
4. **Attack patterns** (SQL injection, XSS)
5. **Large file uploads**
6. **Bot detection**

### Log Format

```typescript
{
  requestId: string,
  timestamp: ISO8601,
  method: string,
  path: string,
  ip: string,
  userId?: string,
  event: string,
  severity: "info" | "warn" | "error",
  details: object
}
```

### Monitoring Recommendations

Set up alerts for:

- High rate limit hit rate (>10% of requests)
- Spike in authentication failures
- Repeated attack pattern detections
- Unusual upload activity
- Bot traffic surge

---

## Best Practices

### For Developers

1. **Never trust user input**: Always validate and sanitize
2. **Use middleware consistently**: Apply security middleware to all routes
3. **Follow least privilege**: Grant minimum required permissions
4. **Sanitize before storage**: Clean input before database writes
5. **Encode on output**: Sanitize data before sending to clients
6. **Use parameterized queries**: Never concatenate SQL
7. **Log security events**: Record suspicious activity
8. **Keep dependencies updated**: Regularly update security packages

### For API Consumers

1. **Use HTTPS**: Always connect via secure protocol
2. **Protect tokens**: Never expose authentication tokens
3. **Respect rate limits**: Implement exponential backoff
4. **Validate file types**: Check files before upload
5. **Handle errors gracefully**: Don't expose error details to users

### Configuration

Environment variables for security settings:

```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Upload Limits
MAX_IMAGE_SIZE_MB=5
MAX_AUDIO_SIZE_MB=10
MAX_VIDEO_SIZE_MB=50
MAX_FILES_PER_UPLOAD=10

# Security Features
ENABLE_RATE_LIMITING=true
ENABLE_REQUEST_VALIDATION=true
LOG_SUSPICIOUS_ACTIVITY=true
ENFORCE_HTTPS=true  # Production only

# Trusted Proxies (for X-Forwarded-For)
TRUSTED_PROXY=127.0.0.1
```

---

## Security Testing

### Unit Tests

Test individual security components:

```bash
npm test -- validation.middleware.test.ts
npm test -- rateLimiter.middleware.test.ts
npm test -- upload.middleware.test.ts
npm test -- security.utils.test.ts
```

### Integration Tests

Test security in context:

```bash
npm test -- auth.integration.test.ts
npm test -- upload.integration.test.ts
npm test -- ratelimit.integration.test.ts
```

### Security Test Scenarios

#### 1. SQL Injection

```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{"title":"Test'; DROP TABLE issues;--"}'
```

**Expected**: Request blocked, pattern logged

#### 2. XSS Attack

```bash
curl -X POST http://localhost:3000/api/issues \
  -H "Content-Type: application/json" \
  -d '{"description":"<script>alert(1)</script>"}'
```

**Expected**: Tags escaped or removed

#### 3. Path Traversal

```bash
curl -X POST http://localhost:3000/api/issues/upload-image \
  -F "images=@../../../etc/passwd"
```

**Expected**: Upload rejected, filename sanitized

#### 4. Rate Limit Bypass

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"idToken":"fake"}'
done
```

**Expected**: After 5 attempts, requests blocked with 429 status

#### 5. Oversized Upload

```bash
curl -X POST http://localhost:3000/api/issues/upload-image \
  -F "images=@large_file_10mb.jpg"
```

**Expected**: Upload rejected with LIMIT_FILE_SIZE error

#### 6. Invalid MIME Type

```bash
curl -X POST http://localhost:3000/api/issues/upload-image \
  -F "images=@malicious.php.jpg"
```

**Expected**: Magic number validation fails, upload rejected

### Penetration Testing

For production systems, consider:

1. **OWASP ZAP**: Automated security scanning
2. **Burp Suite**: Manual penetration testing
3. **Security audits**: Professional security review
4. **Bug bounty programs**: Crowdsourced security testing

---

## Incident Response

### If an Attack is Detected

1. **Identify**: Check logs for attack patterns
2. **Isolate**: Block offending IP addresses
3. **Investigate**: Determine scope of attack
4. **Remediate**: Patch vulnerabilities
5. **Monitor**: Watch for continued attempts

### Log Analysis

Use request IDs to trace attack patterns:

```bash
# Find all requests from suspicious IP
grep "192.168.1.100" logs/security.log

# Find all SQL injection attempts
grep "SQL_INJECTION" logs/security.log

# Find all rate limit violations
grep "RATE_LIMIT_EXCEEDED" logs/security.log
```

---

## Updates and Maintenance

### Regular Updates

Keep security packages up to date:

```bash
npm update express-validator
npm update express-rate-limit
npm update multer
npm update helmet
npm audit fix
```

### Security Advisories

Monitor security advisories:

- [GitHub Security Advisories](https://github.com/advisories)
- [NPM Security Advisories](https://www.npmjs.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln)

### Version Control

Document all security changes in version control with:

- Clear commit messages
- Reference to security issues
- Testing confirmation

---

## Support and Contact

For security concerns or vulnerabilities:

- **Internal**: Contact security team
- **External**: Report to security@example.com

**Do NOT** publicly disclose security vulnerabilities.

---

## Compliance

This security implementation supports compliance with:

- **OWASP Top 10**: Protection against common web vulnerabilities
- **GDPR**: Data protection and privacy
- **PCI DSS**: If handling payment data
- **HIPAA**: If handling health information

---

_Last updated: January 2025_
_Version: 1.0.0_
