# CampusCare API Specification

## Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: `https://campuscare-backend-[hash].run.app/api/v1`

## Authentication

All protected endpoints require a Firebase JWT token in the Authorization header:

```
Authorization: Bearer <firebase-jwt-token>
```

## API Endpoints

### Issues

#### Create Issue

```http
POST /api/v1/issues
Content-Type: application/json
Authorization: Bearer <token>

{
  "category": "WATER",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "severity": 4,
  "description": "Water leakage in basement",
  "building_id": "BLDG-101"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "WATER",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.006
    },
    "severity": 4,
    "status": "OPEN",
    "description": "Water leakage in basement",
    "building_id": "BLDG-101",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T10:30:00Z"
  }
}
```

#### Get All Issues

```http
GET /api/v1/issues?category=WATER&status=OPEN&severity_min=3&start_date=2025-01-01
Authorization: Bearer <token>
```

**Query Parameters:**

- `category` (optional): WATER, ELECTRICITY, WIFI, SANITATION, CROWDING, TEMPERATURE
- `status` (optional): OPEN, IN_PROGRESS, RESOLVED
- `severity_min` (optional): 1-5
- `severity_max` (optional): 1-5
- `start_date` (optional): ISO 8601 date
- `end_date` (optional): ISO 8601 date
- `limit` (optional): Default 100, max 1000
- `offset` (optional): For pagination

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "issues": [...],
    "total": 150,
    "limit": 100,
    "offset": 0
  }
}
```

#### Get Issue by ID

```http
GET /api/v1/issues/:id
Authorization: Bearer <token>
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "WATER",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.006
    },
    "severity": 4,
    "status": "OPEN",
    "description": "Water leakage in basement",
    "building_id": "BLDG-101",
    "created_at": "2025-12-16T10:30:00Z",
    "updated_at": "2025-12-16T10:30:00Z",
    "resolved_at": null
  }
}
```

#### Update Issue

```http
PATCH /api/v1/issues/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "status": "IN_PROGRESS",
  "severity": 3
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "IN_PROGRESS",
    "severity": 3,
    "updated_at": "2025-12-16T11:00:00Z"
  }
}
```

#### Delete Issue

```http
DELETE /api/v1/issues/:id
Authorization: Bearer <token>
```

**Response** (204 No Content)

### Analytics

#### Get Heatmap Data

```http
GET /api/v1/analytics/heatmap?category=WATER&start_date=2025-01-01&end_date=2025-12-31
Authorization: Bearer <token>
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "points": [
      {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "weight": 8.5
      },
      ...
    ]
  }
}
```

#### Get Trends

```http
GET /api/v1/analytics/trends?category=WATER&period=monthly
Authorization: Bearer <token>
```

**Query Parameters:**

- `category` (optional): Filter by category
- `period`: daily, weekly, monthly
- `start_date` (optional)
- `end_date` (optional)

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "trends": [
      {
        "period": "2025-01",
        "count": 45,
        "avg_severity": 3.2
      },
      {
        "period": "2025-02",
        "count": 52,
        "avg_severity": 3.5
      }
    ]
  }
}
```

#### Get Zone Risk Scores

```http
GET /api/v1/analytics/risk-scores
Authorization: Bearer <token>
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "zone_id": "ZONE-A",
        "building_id": "BLDG-101",
        "risk_score": 8.7,
        "issue_count": 23,
        "recurrence_probability": 0.65
      }
    ]
  }
}
```

### AI Insights

#### Generate Insights

```http
POST /api/v1/ai/insights
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "Which areas need urgent maintenance?",
  "context": {
    "time_range": "last_30_days",
    "categories": ["WATER", "ELECTRICITY"]
  }
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "insight": "Based on the last 30 days, Building A (Zone 3) requires urgent attention due to 15 water-related issues with an average severity of 4.2. The recurrence rate is 78%, indicating a systemic problem that needs immediate investigation.",
    "recommendations": [
      "Conduct thorough inspection of Building A water infrastructure",
      "Prioritize Zone 3 for maintenance scheduling",
      "Consider proactive pipe replacement"
    ],
    "data_points": {
      "issue_count": 15,
      "avg_severity": 4.2,
      "recurrence_rate": 0.78
    }
  }
}
```

#### Generate Report

```http
POST /api/v1/ai/reports
Content-Type: application/json
Authorization: Bearer <token>

{
  "report_type": "weekly",
  "start_date": "2025-12-09",
  "end_date": "2025-12-16"
}
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "report_id": "RPT-2025-W50",
    "title": "Weekly Infrastructure Report",
    "summary": "This week saw a 15% increase in reported issues...",
    "key_findings": [...],
    "recommendations": [...],
    "generated_at": "2025-12-16T10:00:00Z"
  }
}
```

### Authentication

#### Health Check

```http
GET /api/v1/health
```

**Response** (200 OK):

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-12-16T10:00:00Z",
    "version": "1.0.0"
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "latitude",
        "message": "Must be a valid latitude (-90 to 90)"
      }
    ]
  }
}
```

**Common Error Codes:**

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

- **Default**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1702728000
```
