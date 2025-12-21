# Issue Management API Documentation

## Base URL

```
http://localhost:3001/api/issues
```

## Authentication

All endpoints require authentication. Include Firebase ID token in Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

---

## Endpoints

### 1. Create Issue

**POST** `/api/issues`

Create a new infrastructure issue report.

**Request Body:**

```json
{
  "organizationId": "string (required)",
  "buildingId": "string (required)",
  "departmentId": "string (optional)",
  "roomId": "string (optional)",
  "title": "string (required)",
  "description": "string (required)",
  "category": "Structural | Electrical | Plumbing | HVAC | Safety | Maintenance | Cleanliness | Network | Furniture | Other",
  "latitude": "number (required)",
  "longitude": "number (required)",
  "submissionType": "text | voice | image | mixed (default: text)",
  "voiceTranscript": "string (optional)",
  "voiceAudioUrl": "string (optional)",
  "images": ["string array of URLs (optional)"],
  "aiImageAnalysis": "string (optional)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "issue-123",
    "organizationId": "org-1",
    "buildingId": "building-1",
    "title": "Broken AC in Lab 301",
    "description": "AC not working since morning",
    "category": "HVAC",
    "severity": 5,
    "status": "open",
    "priority": "medium",
    "location": { "_latitude": 22.131, "_longitude": 82.149 },
    "reportedBy": "user-123",
    "reportedByRole": "student",
    "aiRiskScore": 50,
    "createdAt": { "_seconds": 1702838400, "_nanoseconds": 0 },
    "updatedAt": { "_seconds": 1702838400, "_nanoseconds": 0 }
  },
  "message": "Issue created successfully"
}
```

---

### 2. Get All Issues (with filters)

**GET** `/api/issues`

Fetch issues with optional filters.

**Query Parameters:**

- `organizationId` (required): Filter by organization
- `buildingId` (optional): Filter by building
- `departmentId` (optional): Filter by department
- `roomId` (optional): Filter by room
- `category` (optional): Filter by issue category
- `status` (optional): `open | in_progress | resolved | closed`
- `priority` (optional): `low | medium | high | critical`
- `reportedBy` (optional): Filter by reporter user ID
- `assignedTo` (optional): Filter by assigned user ID
- `startDate` (optional): Filter by creation date (ISO 8601)
- `endDate` (optional): Filter by creation date (ISO 8601)
- `limit` (optional): Number of results (default: all)
- `offset` (optional): Pagination offset (default: 0)

**Example:**

```
GET /api/issues?organizationId=org-1&status=open&priority=high&limit=20
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      /* issue object */
    },
    {
      /* issue object */
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

---

### 3. Get Single Issue

**GET** `/api/issues/:id`

Get detailed information about a specific issue.

**Response (200):**

```json
{
  "success": true,
  "data": {
    /* complete issue object */
  }
}
```

---

### 4. Update Issue

**PATCH** `/api/issues/:id`

Update issue fields (partial update).

**Request Body (any fields):**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "category": "Electrical",
  "severity": 7,
  "estimatedCost": 5000,
  "estimatedDuration": 3
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    /* updated issue object */
  },
  "message": "Issue updated successfully"
}
```

---

### 5. Resolve Issue

**PATCH** `/api/issues/:id/resolve`

Mark issue as resolved (Facility Manager/Admin only).

**Request Body:**

```json
{
  "resolutionComment": "string (optional)",
  "actualCost": "number (optional)",
  "actualDuration": "number in days (optional)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "issue-123",
    "status": "resolved",
    "resolvedAt": { "_seconds": 1702924800, "_nanoseconds": 0 },
    "actualCost": 4500,
    "actualDuration": 2
  },
  "message": "Issue resolved successfully"
}
```

---

### 6. Assign Issue

**PATCH** `/api/issues/:id/assign`

Assign issue to a user (Facility Manager/Admin only).

**Request Body:**

```json
{
  "assignedTo": "user-456"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "issue-123",
    "assignedTo": "user-456",
    "status": "in_progress"
  },
  "message": "Issue assigned successfully"
}
```

---

### 7. Delete Issue

**DELETE** `/api/issues/:id`

Close/soft-delete issue (Admin only).

**Response (200):**

```json
{
  "success": true,
  "message": "Issue closed successfully"
}
```

---

### 8. Get Issue History

**GET** `/api/issues/:id/history`

Get change history for an issue.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "history-1",
      "issueId": "issue-123",
      "fieldName": "status",
      "oldValue": "open",
      "newValue": "in_progress",
      "changedBy": "user-456",
      "changeType": "status_change",
      "comment": "Started working on this",
      "changedAt": { "_seconds": 1702838400, "_nanoseconds": 0 }
    }
  ]
}
```

---

### 9. Upload Image

**POST** `/api/issues/upload-image`

Upload image for issue (before or after creation).

**Request Body:**

```json
{
  "image": "base64-encoded-image-string",
  "fileName": "issue-photo.jpg",
  "organizationId": "org-1",
  "issueId": "issue-123 (optional - leave empty for temp upload)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "url": "https://storage.googleapis.com/bucket/issues/org-1/issue-123/photo.jpg"
  },
  "message": "Image uploaded successfully"
}
```

---

### 10. Get Nearby Issues (Heatmap)

**GET** `/api/issues/nearby`

Get issues within a geographic radius.

**Query Parameters:**

- `organizationId` (required): Organization ID
- `latitude` (required): Center latitude
- `longitude` (required): Center longitude
- `radius` (optional): Radius in kilometers (default: 1.0)

**Example:**

```
GET /api/issues/nearby?organizationId=org-1&latitude=22.131&longitude=82.149&radius=0.5
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      /* issue with location within radius */
    }
  ],
  "metadata": {
    "center": { "latitude": "22.131", "longitude": "82.149" },
    "radius": 0.5,
    "count": 8
  }
}
```

---

### 11. Get High-Priority Issues

**GET** `/api/issues/priority`

Get sorted list of high-priority issues.

**Query Parameters:**

- `organizationId` (required): Organization ID
- `limit` (optional): Number of results (default: 20)

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      /* high-priority issue sorted by AI risk score */
    }
  ]
}
```

---

### 12. Get Issue Statistics

**GET** `/api/issues/stats`

Get aggregated statistics (Facility Manager/Admin only).

**Query Parameters:**

- `organizationId` (required): Organization ID

**Response (200):**

```json
{
  "success": true,
  "data": {
    "total": 247,
    "open": 45,
    "inProgress": 32,
    "resolved": 170,
    "byCategory": {
      "Electrical": 45,
      "HVAC": 38,
      "Plumbing": 22,
      "Safety": 15,
      "Other": 127
    },
    "byPriority": {
      "critical": 8,
      "high": 24,
      "medium": 89,
      "low": 126
    },
    "avgResolutionTime": 36.5
  }
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing parameters",
  "message": "organizationId, buildingId, title, and description are required"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You don't have permission to resolve issues"
}
```

### 404 Not Found

```json
{
  "error": "Not found",
  "message": "Issue not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Failed to create issue"
}
```

---

## Permission Matrix

| Endpoint       | Student       | Faculty  | Staff | Facility Manager | Admin    |
| -------------- | ------------- | -------- | ----- | ---------------- | -------- |
| Create Issue   | ✅            | ✅       | ✅    | ✅               | ✅       |
| Get Issues     | ✅ (own only) | ✅       | ✅    | ✅ (all)         | ✅ (all) |
| Get Issue      | ✅            | ✅       | ✅    | ✅               | ✅       |
| Update Issue   | ✅ (own)      | ✅ (own) | ✅    | ✅               | ✅       |
| Resolve Issue  | ❌            | ❌       | ❌    | ✅               | ✅       |
| Assign Issue   | ❌            | ❌       | ❌    | ✅               | ✅       |
| Delete Issue   | ❌            | ❌       | ❌    | ❌               | ✅       |
| Upload Image   | ✅            | ✅       | ✅    | ✅               | ✅       |
| Get Nearby     | ✅            | ✅       | ✅    | ✅               | ✅       |
| Get Priorities | ✅            | ✅       | ✅    | ✅               | ✅       |
| Get Stats      | ❌            | ❌       | ❌    | ✅               | ✅       |

---

## Issue Lifecycle

```
┌─────────┐
│  OPEN   │  ← Issue created
└────┬────┘
     │
     │ Facility Manager assigns
     ▼
┌──────────────┐
│ IN_PROGRESS  │  ← Work in progress
└──────┬───────┘
       │
       │ Facility Manager resolves
       ▼
  ┌──────────┐
  │ RESOLVED │  ← Issue fixed
  └─────┬────┘
        │
        │ Admin closes (optional)
        ▼
   ┌────────┐
   │ CLOSED │  ← Issue archived
   └────────┘
```

---

## Integration Examples

### Example 1: Student Reports Broken AC

```bash
# 1. Student creates issue
curl -X POST http://localhost:3001/api/issues \
  -H "Authorization: Bearer <student-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ggv",
    "buildingId": "engineering-block",
    "roomId": "lab-301",
    "title": "AC Not Working in Lab 301",
    "description": "AC stopped working since morning. Very hot inside.",
    "category": "HVAC",
    "latitude": 22.1310,
    "longitude": 82.1495
  }'

# Response: Issue created with ID "issue-789", status "open", priority "medium"
```

### Example 2: Facility Manager Assigns Issue

```bash
# 2. Facility manager assigns to maintenance staff
curl -X PATCH http://localhost:3001/api/issues/issue-789/assign \
  -H "Authorization: Bearer <facility-manager-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedTo": "maintenance-staff-123"
  }'

# Response: Issue status changed to "in_progress"
```

### Example 3: Staff Resolves Issue

```bash
# 3. Staff marks issue as resolved
curl -X PATCH http://localhost:3001/api/issues/issue-789/resolve \
  -H "Authorization: Bearer <facility-manager-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "resolutionComment": "Replaced faulty compressor",
    "actualCost": 5500,
    "actualDuration": 2
  }'

# Response: Issue resolved, resolvedAt timestamp added
```

---

## Notes

- All timestamps are Firestore Timestamp objects with `_seconds` and `_nanoseconds`
- GeoPoints have `_latitude` and `_longitude` fields
- Students can only see their own reported issues
- AI risk scores and priorities are auto-calculated on creation
- Issue history is automatically logged for all changes
- Images are stored in Firebase Storage with public URLs
