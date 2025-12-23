# Admin Dashboard API Documentation

## Overview

The Admin Dashboard API provides comprehensive administrative functionality for managing users, issues, and viewing system-wide analytics. All endpoints require authentication and admin role authorization.

## Base URL

```
/api/admin
```

## Authentication

All admin routes require:

- Valid JWT token in Authorization header
- User role must be `admin`

```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Dashboard Overview

Get comprehensive dashboard metrics and insights.

**Endpoint:** `GET /api/admin/dashboard`

**Response:**

```json
{
  "success": true,
  "data": {
    "userStats": {
      "total": 1250,
      "active": 1180,
      "byRole": {
        "admin": 5,
        "facilityManager": 15,
        "staff": 80,
        "faculty": 350,
        "student": 800
      }
    },
    "issueStats": {
      "total": 456,
      "open": 123,
      "inProgress": 89,
      "resolved": 234,
      "closed": 10,
      "avgResolutionTime": 24.5,
      "bySeverity": {
        "critical": 12,
        "high": 45,
        "medium": 178,
        "low": 221
      }
    },
    "recentIssues": [...],
    "recentUsers": [...],
    "topContributors": [...]
  }
}
```

---

### 2. User Management

#### Get All Users

Get paginated list of users with filters.

**Endpoint:** `GET /api/admin/users`

**Query Parameters:**

- `role` (optional): Filter by user role
- `isActive` (optional): Filter by active status (true/false)
- `search` (optional): Search by name or email
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `sortBy` (default: createdAt): Sort field
- `sortOrder` (default: desc): Sort order (asc/desc)

**Example:**

```
GET /api/admin/users?role=student&isActive=true&page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user123",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "student",
        "isActive": true,
        "rewardPoints": 150,
        "level": 3,
        "statistics": {
          "issuesReported": 12,
          "issuesResolved": 0,
          "votesReceived": 45,
          "votesCast": 28
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 800,
      "page": 1,
      "limit": 20,
      "totalPages": 40
    }
  }
}
```

#### Get User by ID

Get detailed information about a specific user.

**Endpoint:** `GET /api/admin/users/:userId`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "organizationId": "ggv-bilaspur",
    "isActive": true,
    "rewardPoints": 150,
    "level": 3,
    "badges": ["first_report", "helpful_voter"],
    "statistics": {...},
    "issuesReported": [...],
    "issuesCount": 12
  }
}
```

#### Update User

Update user details.

**Endpoint:** `PATCH /api/admin/users/:userId`

**Request Body:**

```json
{
  "name": "John Updated",
  "role": "faculty",
  "isActive": true,
  "rewardPoints": 200
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "name": "John Updated",
    "role": "faculty",
    ...
  },
  "message": "User updated successfully"
}
```

#### Delete User

Delete a user from the system.

**Endpoint:** `DELETE /api/admin/users/:userId`

**Response:**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Note:** Cannot delete your own admin account.

#### Toggle User Status

Activate or deactivate a user.

**Endpoint:** `PATCH /api/admin/users/:userId/toggle-status`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "user123",
    "isActive": false,
    ...
  },
  "message": "User deactivated successfully"
}
```

#### Get User Statistics

Get detailed statistics for a specific user.

**Endpoint:** `GET /api/admin/users/:userId/stats`

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "rewardPoints": 150,
      "level": 3,
      "badges": [...]
    },
    "statistics": {
      "issuesReported": 12,
      "issuesResolved": 0,
      "votesReceived": 45,
      "votesCast": 28
    },
    "issueStatistics": {
      "total": 12,
      "byStatus": {
        "open": 3,
        "inProgress": 2,
        "resolved": 7,
        "closed": 0
      },
      "byCategory": {
        "electrical": 5,
        "plumbing": 4,
        "structural": 3
      },
      "avgSeverity": 6.2
    },
    "votingActivity": {
      "totalVotes": 28
    }
  }
}
```

#### Get User Activity

Get activity logs for a specific user.

**Endpoint:** `GET /api/admin/users/:userId/activity`

**Query Parameters:**

- `page` (default: 1): Page number
- `limit` (default: 50): Items per page

**Response:**

```json
{
  "success": true,
  "data": {
    "activity": [
      {
        "activityType": "issue_reported",
        "id": "issue789",
        "title": "Broken water fountain",
        "createdAt": "2024-03-15T14:30:00Z"
      },
      {
        "activityType": "vote_cast",
        "issueId": "issue456",
        "votedAt": "2024-03-14T10:15:00Z"
      }
    ],
    "pagination": {
      "total": 40,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

#### Bulk Update Users

Update multiple users at once.

**Endpoint:** `PATCH /api/admin/users/bulk`

**Request Body:**

```json
{
  "userIds": ["user123", "user456", "user789"],
  "updates": {
    "isActive": true,
    "role": "faculty"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "successCount": 3,
    "failureCount": 0,
    "errors": []
  },
  "message": "3 users updated successfully"
}
```

#### Export Users

Export users data as JSON or CSV.

**Endpoint:** `GET /api/admin/users/export`

**Query Parameters:**

- `format` (default: json): Export format (json/csv)

**Example:**

```
GET /api/admin/users/export?format=csv
```

**Response:** File download (JSON or CSV format)

---

### 3. Issue Management

#### Get All Issues

Get paginated list of all issues with admin filters.

**Endpoint:** `GET /api/admin/issues`

**Query Parameters:**

- `status` (optional): Filter by status
- `category` (optional): Filter by category
- `severity` (optional): Filter by severity level
- `buildingId` (optional): Filter by building
- `reportedBy` (optional): Filter by reporter user ID
- `assignedTo` (optional): Filter by assigned user ID
- `search` (optional): Search in title/description
- `startDate` (optional): Filter by creation date (from)
- `endDate` (optional): Filter by creation date (to)
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `sortBy` (default: createdAt): Sort field
- `sortOrder` (default: desc): Sort order

**Example:**

```
GET /api/admin/issues?status=open&severity=7&page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": {
    "issues": [
      {
        "id": "issue123",
        "title": "Broken water fountain",
        "description": "...",
        "status": "open",
        "category": "plumbing",
        "severity": 7,
        "priority": 85,
        "buildingId": "building_001",
        "reportedBy": "user123",
        "reporterName": "John Doe",
        "voteCount": 15,
        "createdAt": "2024-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 123,
      "page": 1,
      "limit": 20,
      "totalPages": 7
    }
  }
}
```

#### Export Issues

Export issues data as JSON or CSV.

**Endpoint:** `GET /api/admin/issues/export`

**Query Parameters:**

- `format` (default: json): Export format (json/csv)
- `status` (optional): Filter by status
- `category` (optional): Filter by category

**Example:**

```
GET /api/admin/issues/export?format=csv&status=resolved
```

**Response:** File download (JSON or CSV format)

---

### 4. Analytics

#### Get System Analytics

Get comprehensive system-wide analytics.

**Endpoint:** `GET /api/admin/analytics`

**Query Parameters:**

- `startDate` (optional): Start date for analytics period
- `endDate` (optional): End date for analytics period

**Example:**

```
GET /api/admin/analytics?startDate=2024-01-01&endDate=2024-03-31
```

**Response:**

```json
{
  "success": true,
  "data": {
    "issuesTrend": [
      { "date": "2024-01-01", "count": 12 },
      { "date": "2024-01-02", "count": 15 },
      ...
    ],
    "resolutionTrend": [
      { "date": "2024-01-01", "count": 8 },
      { "date": "2024-01-02", "count": 10 },
      ...
    ],
    "categoryDistribution": {
      "electrical": 145,
      "plumbing": 123,
      "structural": 89,
      "hvac": 67,
      "other": 32
    },
    "buildingDistribution": {
      "building_001": 120,
      "building_002": 95,
      ...
    },
    "severityDistribution": {
      "critical": 12,
      "high": 45,
      "medium": 178,
      "low": 221
    },
    "avgResolutionTime": 24.5,
    "totalIssues": 456,
    "resolvedIssues": 234,
    "resolutionRate": 51.3
  }
}
```

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

**Status Codes:**

- `400`: Bad Request - Invalid parameters
- `401`: Unauthorized - Missing or invalid token
- `403`: Forbidden - Insufficient permissions (not admin)
- `404`: Not Found - Resource not found
- `500`: Server Error - Internal server error

---

## Use Cases

### 1. User Management Dashboard

```javascript
// Get dashboard overview
const overview = await fetch("/api/admin/dashboard");

// Get paginated users
const users = await fetch("/api/admin/users?page=1&limit=20");

// View user details
const userDetails = await fetch("/api/admin/users/user123");

// Update user role
await fetch("/api/admin/users/user123", {
  method: "PATCH",
  body: JSON.stringify({ role: "faculty" }),
});

// Deactivate user
await fetch("/api/admin/users/user123/toggle-status", {
  method: "PATCH",
});
```

### 2. Issue Management

```javascript
// Get all open critical issues
const criticalIssues = await fetch("/api/admin/issues?status=open&severity=8");

// Export resolved issues for reporting
const exportData = await fetch(
  "/api/admin/issues/export?format=csv&status=resolved"
);
```

### 3. Analytics and Reporting

```javascript
// Get system analytics for last quarter
const analytics = await fetch(
  "/api/admin/analytics?startDate=2024-01-01&endDate=2024-03-31"
);

// Export all users data
const userData = await fetch("/api/admin/users/export?format=json");
```

---

## Features

✅ **User Management**

- View, create, update, delete users
- Activate/deactivate accounts
- Bulk operations
- Export user data

✅ **Issue Management**

- View all issues across the organization
- Advanced filtering and search
- Export issue data
- Admin can resolve/delete any issue

✅ **Analytics Dashboard**

- Real-time metrics
- Trend analysis
- Category and severity distributions
- Resolution time tracking
- Top contributors

✅ **Activity Monitoring**

- User activity logs
- Issue creation trends
- Resolution tracking

✅ **Data Export**

- JSON and CSV formats
- Customizable filters
- Bulk data export

---

## Notes

- All admin operations are logged
- Admin users cannot delete or deactivate their own accounts
- Bulk operations provide detailed success/failure reports
- Export endpoints support large datasets efficiently
- All timestamps are in ISO 8601 format
