# API Security Reference

Quick reference guide for API security features, rate limits, and validation rules.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limits by Endpoint](#rate-limits-by-endpoint)
- [Input Validation Rules](#input-validation-rules)
- [File Upload Specifications](#file-upload-specifications)
- [Error Codes](#error-codes)
- [Security Headers](#security-headers)

---

## Authentication

### Token Requirements

All protected endpoints require a Firebase ID token:

```http
Authorization: Bearer <firebase-id-token>
```

### Getting a Token

1. **Frontend**: Use Firebase Authentication SDK
2. **Testing**: Get token from Firebase Console

### Token Lifespan

- **Default**: 1 hour
- **Refresh**: Use Firebase SDK to refresh automatically

---

## Rate Limits by Endpoint

### Authentication Endpoints

| Endpoint                          | Method | Rate Limit   | Window |
| --------------------------------- | ------ | ------------ | ------ |
| `/api/auth/login`                 | POST   | 5 requests   | 15 min |
| `/api/auth/logout`                | POST   | 100 requests | 15 min |
| `/api/auth/me`                    | GET    | 100 requests | 15 min |
| `/api/auth/profile`               | PATCH  | 100 requests | 15 min |
| `/api/auth/users/:organizationId` | GET    | 100 requests | 15 min |
| `/api/auth/users/:userId/role`    | PATCH  | 100 requests | 15 min |
| `/api/auth/users/:userId`         | DELETE | 100 requests | 15 min |

### Issue Endpoints

| Endpoint                   | Method | Rate Limit   | Window |
| -------------------------- | ------ | ------------ | ------ |
| `/api/issues`              | POST   | 20 issues    | 1 hour |
| `/api/issues`              | GET    | 100 requests | 15 min |
| `/api/issues/nearby`       | GET    | 100 requests | 15 min |
| `/api/issues/upload-image` | POST   | 30 uploads   | 1 hour |
| `/api/issues/:id`          | GET    | 100 requests | 15 min |
| `/api/issues/:id`          | PATCH  | 100 requests | 15 min |

### Heatmap Endpoints

| Endpoint                | Method | Rate Limit   | Window |
| ----------------------- | ------ | ------------ | ------ |
| `/api/heatmap/data`     | GET    | 100 requests | 15 min |
| `/api/heatmap/geojson`  | GET    | 100 requests | 15 min |
| `/api/heatmap/clusters` | GET    | 100 requests | 15 min |
| `/api/heatmap/grid`     | GET    | 100 requests | 15 min |
| `/api/heatmap/stats`    | GET    | 100 requests | 15 min |
| `/api/heatmap/explain`  | GET    | 100 requests | 15 min |

### AI Endpoints

| Endpoint                   | Method | Rate Limit  | Window |
| -------------------------- | ------ | ----------- | ------ |
| `/api/ai/insights`         | GET    | 50 requests | 1 hour |
| `/api/ai/risk/:buildingId` | GET    | 50 requests | 1 hour |
| `/api/ai/summary/:issueId` | GET    | 50 requests | 1 hour |
| `/api/ai/suggestions`      | GET    | 50 requests | 1 hour |
| `/api/ai/chat`             | POST   | 50 requests | 1 hour |

### Priority Endpoints

| Endpoint                    | Method | Rate Limit   | Window |
| --------------------------- | ------ | ------------ | ------ |
| `/api/priority/calculate`   | POST   | 100 requests | 15 min |
| `/api/priority/batch`       | POST   | 100 requests | 15 min |
| `/api/priority/recalculate` | POST   | 100 requests | 15 min |
| `/api/priority/explain`     | GET    | 100 requests | 15 min |
| `/api/priority/simulate`    | POST   | 100 requests | 15 min |

### Realtime Endpoints

| Endpoint                       | Method | Rate Limit     | Window |
| ------------------------------ | ------ | -------------- | ------ |
| `/api/realtime/heatmap/stream` | GET    | 10 connections | 1 min  |
| `/api/realtime/issues/stream`  | GET    | 10 connections | 1 min  |
| `/api/realtime/stats`          | GET    | 100 requests   | 15 min |

### Rate Limit Headers

Every response includes:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

When rate limited (429 status):

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 900
}
```

**Best Practice**: Implement exponential backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Input Validation Rules

### Common Fields

#### Email

- **Format**: RFC 5322 compliant
- **Max length**: 255 characters
- **Normalized**: Lowercase
- **Example**: `user@example.com`

#### Password

- **Min length**: 8 characters
- **Max length**: 128 characters
- **Requirements**:
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (@$!%\*?&#)
- **Example**: `MyP@ssw0rd`

#### Phone

- **Format**: E.164 international format
- **Regex**: `^\+?[1-9]\d{1,14}$`
- **Example**: `+14155552671`

#### ID Fields

- **Min length**: 1 character
- **Max length**: 128 characters
- **Allowed**: Alphanumeric, hyphens, underscores
- **Pattern**: `^[a-zA-Z0-9_-]+$`

### Issue Fields

#### Title

- **Min length**: 5 characters
- **Max length**: 200 characters
- **Allowed**: Alphanumeric, spaces, basic punctuation
- **Required**: Yes

#### Description

- **Min length**: 10 characters
- **Max length**: 2000 characters
- **Required**: Yes
- **Sanitization**: HTML tags removed

#### Category

- **Type**: Enum
- **Values**:
  - `PLUMBING`
  - `ELECTRICAL`
  - `HVAC`
  - `STRUCTURAL`
  - `SAFETY`
  - `CLEANLINESS`
  - `ACCESSIBILITY`
  - `TECHNOLOGY`
  - `FURNITURE`
  - `OTHER`
- **Required**: Yes

#### Location

- **latitude**: -90 to 90 (decimal degrees)
- **longitude**: -180 to 180 (decimal degrees)
- **Required**: Yes

#### Building ID

- **Type**: String (ID format)
- **Required**: Yes

#### Organization ID

- **Type**: String (ID format)
- **Required**: Yes

#### Images

- **Type**: Array of strings (URLs)
- **Max items**: 10
- **Required**: No

### Heatmap Query Parameters

#### organizationId

- **Type**: String (ID format)
- **Required**: Yes

#### campusId

- **Type**: String (ID format)
- **Required**: No

#### categories

- **Type**: Array of category enums
- **Required**: No

#### startDate / endDate

- **Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Validation**: startDate < endDate, endDate ≤ now
- **Required**: No

#### minSeverity

- **Type**: Number
- **Range**: 0-10
- **Required**: No

#### timeDecayFactor

- **Type**: Number
- **Range**: 0-1
- **Default**: 0.5
- **Required**: No

### Pagination Parameters

#### page

- **Type**: Integer
- **Range**: 1-10000
- **Default**: 1
- **Required**: No

#### limit

- **Type**: Integer
- **Range**: 1-100
- **Default**: 20
- **Required**: No

### Search Parameters

#### query

- **Min length**: 1 character
- **Max length**: 200 characters
- **Allowed**: Alphanumeric, spaces, basic punctuation
- **Required**: Yes

### Coordinate Parameters

#### latitude

- **Type**: Number
- **Range**: -90 to 90
- **Required**: Yes

#### longitude

- **Type**: Number
- **Range**: -180 to 180
- **Required**: Yes

#### radius

- **Type**: Number
- **Range**: 0-50000 (meters)
- **Default**: 1000
- **Required**: No

### Priority Input

#### severity

- **Type**: Number
- **Range**: 0-10
- **Required**: Yes

#### occupancyImpact

- **Type**: Number
- **Range**: 0-100 (percentage)
- **Required**: No

#### affectedArea

- **Type**: Number
- **Range**: 0-100000 (square meters)
- **Required**: No

### Realtime Query Parameters

#### organizationId

- **Type**: String (ID format)
- **Required**: Yes

#### updateInterval

- **Type**: Number
- **Range**: 5000-300000 (milliseconds)
- **Default**: 30000
- **Required**: No

---

## File Upload Specifications

### Image Uploads

#### Allowed Types

- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `image/gif` (.gif)
- `image/webp` (.webp)

#### Size Limits

- **Per file**: 5MB
- **Total per request**: 50MB (10 files × 5MB)
- **Max files**: 10

#### Validation

1. MIME type check
2. File extension check
3. Magic number verification:
   - JPEG: `FF D8 FF`
   - PNG: `89 50 4E 47`
   - GIF: `47 49 46 38`
   - WebP: `WEBP` at offset 8

#### Example Request

```bash
curl -X POST http://localhost:3000/api/issues/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.png"
```

#### Response

```json
{
  "success": true,
  "files": [
    {
      "filename": "1640000000000-abc123.jpg",
      "url": "https://storage.example.com/uploads/1640000000000-abc123.jpg",
      "size": 1024000,
      "mimetype": "image/jpeg"
    }
  ]
}
```

### Audio Uploads

#### Allowed Types

- `audio/mpeg` (.mp3, .mpeg)
- `audio/wav` (.wav)
- `audio/webm` (.webm)
- `audio/ogg` (.ogg)

#### Size Limits

- **Per file**: 10MB

#### Validation

1. MIME type check
2. File extension check
3. Magic number verification:
   - MP3: `FF FB` or `ID3`
   - WAV: `52 49 46 46` (RIFF)
   - OGG: `4F 67 67 53` (OggS)

### Video Uploads

#### Allowed Types

- `video/mp4` (.mp4)
- `video/webm` (.webm)
- `video/ogg` (.ogg)

#### Size Limits

- **Per file**: 50MB

### Upload Errors

| Error Code              | Message               | Description                |
| ----------------------- | --------------------- | -------------------------- |
| `LIMIT_FILE_SIZE`       | File too large        | File exceeds size limit    |
| `LIMIT_FILE_COUNT`      | Too many files        | Exceeded max file count    |
| `LIMIT_UNEXPECTED_FILE` | Unexpected field      | Wrong field name           |
| `UNSUPPORTED_FILE_TYPE` | File type not allowed | MIME type not in whitelist |
| `INVALID_FILE_CONTENT`  | Invalid file content  | Magic number mismatch      |

---

## Error Codes

### HTTP Status Codes

| Code | Meaning               | When Used                |
| ---- | --------------------- | ------------------------ |
| 200  | OK                    | Successful request       |
| 201  | Created               | Resource created         |
| 400  | Bad Request           | Validation error         |
| 401  | Unauthorized          | Missing/invalid token    |
| 403  | Forbidden             | Insufficient permissions |
| 404  | Not Found             | Resource not found       |
| 409  | Conflict              | Duplicate resource       |
| 413  | Payload Too Large     | Upload exceeds limit     |
| 429  | Too Many Requests     | Rate limit exceeded      |
| 500  | Internal Server Error | Server error             |

### Validation Error Format

```json
{
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format",
      "value": "not-an-email"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "value": ""
    }
  ]
}
```

### Authentication Error Format

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### Rate Limit Error Format

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 900,
  "limit": 100,
  "remaining": 0,
  "reset": 1640000000
}
```

---

## Security Headers

### Required Request Headers

```http
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

### Optional Request Headers

```http
X-Request-ID: <uuid>  # For request tracking
```

### Response Headers

Every response includes:

```http
X-Request-ID: <uuid>
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Testing Security

### Test Authentication

```bash
# Without token (should fail)
curl -X GET http://localhost:3000/api/auth/me

# With valid token (should succeed)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer <firebase-token>"
```

### Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"idToken":"test"}'
done
```

### Test Input Validation

```bash
# Invalid email
curl -X POST http://localhost:3000/api/issues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"","description":"Test"}'

# Should return 400 with validation errors
```

### Test File Upload

```bash
# Valid image upload
curl -X POST http://localhost:3000/api/issues/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "images=@test.jpg"

# Invalid file type (should fail)
curl -X POST http://localhost:3000/api/issues/upload-image \
  -H "Authorization: Bearer <token>" \
  -F "images=@test.txt"
```

---

## Best Practices for API Consumers

### 1. Handle Rate Limits

- Monitor `X-RateLimit-Remaining` header
- Implement exponential backoff for 429 errors
- Cache responses when possible

### 2. Validate Before Sending

- Validate input client-side before API calls
- Check file sizes before uploading
- Use appropriate content types

### 3. Secure Token Storage

- Store tokens securely (never in localStorage)
- Use httpOnly cookies when possible
- Implement token refresh logic

### 4. Error Handling

- Handle all error codes appropriately
- Show user-friendly messages
- Log errors for debugging

### 5. HTTPS Only

- Always use HTTPS in production
- Verify SSL certificates
- Never send tokens over HTTP

---

## Support

For API questions or issues:

- **Documentation**: [README.md](../README.md)
- **Security**: [SECURITY.md](../SECURITY.md)
- **Issues**: GitHub Issues

---

_Last updated: January 2025_
_API Version: 1.0.0_
