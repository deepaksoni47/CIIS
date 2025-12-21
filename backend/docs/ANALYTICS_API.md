# Analytics API Documentation

## Overview

The Analytics API provides comprehensive trend analysis and insights for infrastructure issues across your campus. This includes tracking issues per building over time, identifying common issue types, and analyzing resolution times.

## Authentication

All analytics endpoints require authentication. Include a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

---

## Endpoints

### 1. Get Issues Per Building Over Time

**GET** `/api/analytics/issues-per-building`

Track how issues are distributed across buildings over time to identify problem areas and trends.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `startDate` (optional): Start date in ISO 8601 format (default: 30 days ago)
- `endDate` (optional): End date in ISO 8601 format (default: today)
- `groupBy` (optional): Time grouping - `day`, `week`, or `month` (default: `day`)

**Example Request:**

```bash
curl "http://localhost:3001/api/analytics/issues-per-building?organizationId=ORG123&startDate=2025-11-01&endDate=2025-12-21&groupBy=week" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "buildings": [
      {
        "buildingId": "engineering-bldg",
        "buildingName": "Engineering Building",
        "timeSeries": [
          {
            "period": "2025-W44",
            "count": 8
          },
          {
            "period": "2025-W45",
            "count": 12
          },
          {
            "period": "2025-W46",
            "count": 6
          }
        ]
      },
      {
        "buildingId": "science-hall",
        "buildingName": "Science Hall",
        "timeSeries": [
          {
            "period": "2025-W44",
            "count": 5
          },
          {
            "period": "2025-W45",
            "count": 7
          },
          {
            "period": "2025-W46",
            "count": 4
          }
        ]
      }
    ]
  },
  "metadata": {
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-12-21T23:59:59.999Z",
    "groupBy": "week"
  }
}
```

**Use Cases:**

- Identify buildings with increasing issue counts
- Compare issue trends across multiple buildings
- Detect seasonal patterns in infrastructure problems
- Plan maintenance schedules based on historical data

---

### 2. Get Most Common Issue Types

**GET** `/api/analytics/common-issue-types`

Analyze which types of issues occur most frequently to prioritize maintenance resources.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `startDate` (optional): Start date in ISO 8601 format
- `endDate` (optional): End date in ISO 8601 format
- `buildingId` (optional): Filter by specific building
- `limit` (optional): Maximum number of issue types to return (default: 10)

**Example Request:**

```bash
curl "http://localhost:3001/api/analytics/common-issue-types?organizationId=ORG123&buildingId=engineering-bldg&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "issueTypes": [
      {
        "category": "Electrical",
        "count": 45,
        "percentage": 28.5,
        "avgSeverity": 6.2,
        "openCount": 8,
        "resolvedCount": 37
      },
      {
        "category": "HVAC",
        "count": 38,
        "percentage": 24.1,
        "avgSeverity": 5.8,
        "openCount": 12,
        "resolvedCount": 26
      },
      {
        "category": "Plumbing",
        "count": 32,
        "percentage": 20.3,
        "avgSeverity": 7.1,
        "openCount": 5,
        "resolvedCount": 27
      },
      {
        "category": "Safety",
        "count": 25,
        "percentage": 15.8,
        "avgSeverity": 8.5,
        "openCount": 4,
        "resolvedCount": 21
      },
      {
        "category": "Maintenance",
        "count": 18,
        "percentage": 11.4,
        "avgSeverity": 4.2,
        "openCount": 3,
        "resolvedCount": 15
      }
    ],
    "totalIssues": 158
  },
  "metadata": {
    "buildingId": "engineering-bldg",
    "limit": 5
  }
}
```

**Use Cases:**

- Identify which categories need more resources
- Focus preventive maintenance on common issues
- Compare severity levels across categories
- Track resolution rates by category

---

### 3. Get Resolution Time Averages

**GET** `/api/analytics/resolution-times`

Analyze how long it takes to resolve issues, with optional grouping to identify bottlenecks.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `startDate` (optional): Start date in ISO 8601 format
- `endDate` (optional): End date in ISO 8601 format
- `buildingId` (optional): Filter by specific building
- `groupBy` (optional): Group results by `category`, `building`, or `priority`

**Example Request:**

```bash
curl "http://localhost:3001/api/analytics/resolution-times?organizationId=ORG123&groupBy=category" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "overall": {
      "avgResolutionHours": 36.5,
      "medianResolutionHours": 28.0,
      "totalResolved": 247
    },
    "breakdown": [
      {
        "group": "Safety",
        "avgResolutionHours": 12.3,
        "medianResolutionHours": 10.5,
        "count": 45,
        "minResolutionHours": 2.5,
        "maxResolutionHours": 48.0
      },
      {
        "group": "Structural",
        "avgResolutionHours": 72.8,
        "medianResolutionHours": 68.0,
        "count": 28,
        "minResolutionHours": 24.0,
        "maxResolutionHours": 168.0
      },
      {
        "group": "Electrical",
        "avgResolutionHours": 24.5,
        "medianResolutionHours": 20.0,
        "count": 67,
        "minResolutionHours": 4.0,
        "maxResolutionHours": 96.0
      },
      {
        "group": "HVAC",
        "avgResolutionHours": 48.2,
        "medianResolutionHours": 42.0,
        "count": 52,
        "minResolutionHours": 8.0,
        "maxResolutionHours": 144.0
      },
      {
        "group": "Plumbing",
        "avgResolutionHours": 18.7,
        "medianResolutionHours": 16.0,
        "count": 55,
        "minResolutionHours": 3.0,
        "maxResolutionHours": 72.0
      }
    ]
  },
  "metadata": {
    "groupBy": "category"
  }
}
```

**Use Cases:**

- Identify which issue types take longest to resolve
- Compare resolution efficiency across buildings
- Set realistic SLA targets based on historical data
- Identify resource bottlenecks

---

### 4. Get Comprehensive Trends

**GET** `/api/analytics/trends`

Get detailed time-series analysis including issue counts, status distribution, and severity trends.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `startDate` (optional): Start date in ISO 8601 format (default: 30 days ago)
- `endDate` (optional): End date in ISO 8601 format (default: today)
- `groupBy` (optional): Time grouping - `day`, `week`, or `month` (default: `day`)

**Example Request:**

```bash
curl "http://localhost:3001/api/analytics/trends?organizationId=ORG123&groupBy=week" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "timeSeries": [
      {
        "period": "2025-W44",
        "totalIssues": 25,
        "openIssues": 8,
        "resolvedIssues": 17,
        "avgSeverity": 5.8,
        "categoryCounts": {
          "Electrical": 8,
          "HVAC": 6,
          "Plumbing": 5,
          "Safety": 4,
          "Maintenance": 2
        }
      },
      {
        "period": "2025-W45",
        "totalIssues": 32,
        "openIssues": 12,
        "resolvedIssues": 20,
        "avgSeverity": 6.2,
        "categoryCounts": {
          "Electrical": 10,
          "HVAC": 8,
          "Plumbing": 7,
          "Safety": 5,
          "Maintenance": 2
        }
      }
    ]
  },
  "metadata": {
    "startDate": "2025-11-01T00:00:00.000Z",
    "endDate": "2025-12-21T23:59:59.999Z",
    "groupBy": "week"
  }
}
```

**Use Cases:**

- Create comprehensive trend dashboards
- Track overall issue volume changes
- Monitor status distribution over time
- Identify patterns in issue severity

---

### 5. Get Dashboard Analytics (Combined)

**GET** `/api/analytics/dashboard`

Get all analytics data in a single request - perfect for dashboard views.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `startDate` (optional): Start date in ISO 8601 format (default: 30 days ago)
- `endDate` (optional): End date in ISO 8601 format (default: today)
- `buildingId` (optional): Filter by specific building

**Example Request:**

```bash
curl "http://localhost:3001/api/analytics/dashboard?organizationId=ORG123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "issuesPerBuilding": {
      "buildings": [
        {
          "buildingId": "engineering-bldg",
          "buildingName": "Engineering Building",
          "timeSeries": [...]
        }
      ]
    },
    "commonIssueTypes": {
      "issueTypes": [...],
      "totalIssues": 158
    },
    "resolutionTimes": {
      "overall": {
        "avgResolutionHours": 36.5,
        "medianResolutionHours": 28.0,
        "totalResolved": 247
      },
      "breakdown": [...]
    },
    "trends": {
      "timeSeries": [...]
    }
  },
  "metadata": {
    "startDate": "2025-11-21T00:00:00.000Z",
    "endDate": "2025-12-21T23:59:59.999Z"
  }
}
```

**Use Cases:**

- Single API call for dashboard initialization
- Reduced latency with parallel data fetching
- Consistent time ranges across all metrics
- Simplified frontend implementation

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing parameter",
  "message": "organizationId is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to get analytics",
  "message": "Error details..."
}
```

---

## 5. Detect Recurring Issues

**GET** `/api/analytics/recurring-issues`

Detect recurring issues by identifying the same issue type occurring at the same location within a time window. Issues flagged as "Recurring Risk" indicate persistent problems that require immediate attention.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `timeWindowDays` (optional): Time window in days to analyze (default: 30)
- `minOccurrences` (optional): Minimum number of occurrences to flag as recurring (default: 2)
- `locationRadius` (optional): Geographic radius for grouping coordinates (e.g., 0.0001 for ~10 meters)

**Example Request:**

```bash
curl "http://localhost:3001/api/analytics/recurring-issues?organizationId=ORG123&timeWindowDays=30&minOccurrences=2" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "recurringIssues": [
      {
        "category": "Plumbing",
        "buildingId": "science-hall",
        "buildingName": "Science Hall",
        "floor": "2",
        "zone": "West Wing",
        "locationKey": "science-hall|2|West Wing",
        "occurrences": 5,
        "firstOccurrence": "2025-11-15T08:30:00.000Z",
        "lastOccurrence": "2025-12-18T14:20:00.000Z",
        "isRecurringRisk": true,
        "riskScore": 95,
        "issues": [
          {
            "issueId": "issue-123",
            "title": "Leaking pipe in bathroom",
            "status": "OPEN",
            "createdAt": "2025-12-18T14:20:00.000Z",
            "severity": 4,
            "location": {
              "lat": 40.7128,
              "lng": -74.006
            }
          },
          {
            "issueId": "issue-089",
            "title": "Water leak bathroom",
            "status": "RESOLVED",
            "createdAt": "2025-12-10T09:15:00.000Z",
            "severity": 3,
            "location": {
              "lat": 40.7128,
              "lng": -74.006
            }
          }
        ]
      },
      {
        "category": "Electrical",
        "buildingId": "engineering-bldg",
        "buildingName": "Engineering Building",
        "floor": "3",
        "zone": "Lab Area",
        "locationKey": "engineering-bldg|3|Lab Area",
        "occurrences": 3,
        "firstOccurrence": "2025-11-20T10:00:00.000Z",
        "lastOccurrence": "2025-12-15T16:45:00.000Z",
        "isRecurringRisk": true,
        "riskScore": 65,
        "issues": [
          {
            "issueId": "issue-234",
            "title": "Circuit breaker trips frequently",
            "status": "OPEN",
            "createdAt": "2025-12-15T16:45:00.000Z",
            "severity": 5
          }
        ]
      }
    ],
    "summary": {
      "totalRecurringGroups": 2,
      "totalRecurringIssues": 8,
      "highRiskGroups": 2,
      "buildingsAffected": 2
    }
  },
  "metadata": {
    "timeWindowDays": 30,
    "minOccurrences": 2,
    "locationRadius": null
  }
}
```

**Risk Score Calculation:**

The risk score is calculated based on:

- **Occurrences**: Number of times the issue has occurred (higher = more risk)
- **Severity**: Average severity of all occurrences
- **Open Issues**: Number of unresolved issues in the group
- **Frequency**: Time between occurrences (weekly or more = higher risk)

Risk scoring formula:

```
riskScore = (occurrences × 10) + (avgSeverity × 5) + (openIssuesCount × 15) + frequencyBonus
```

**Recurring Risk Flag:**

An issue is flagged as `isRecurringRisk: true` when:

- It has occurred 3 or more times, OR
- Its risk score is 50 or higher

**Use Cases:**

- Identify persistent infrastructure problems
- Prioritize preventive maintenance
- Detect systemic issues requiring root cause analysis
- Track issues that repeatedly occur despite repairs
- Allocate resources to high-risk recurring problems

**Location Grouping:**

- Without `locationRadius`: Groups by building + floor + zone
- With `locationRadius`: Also groups by geographic proximity (useful for large floors)
  - Example: `locationRadius=0.0001` groups issues within ~10 meters
  - Coordinate rounding creates location zones for clustering

---

## Best Practices

### 1. Date Ranges

- Keep date ranges reasonable (< 1 year) for optimal performance
- Use appropriate `groupBy` values: `day` for < 90 days, `week` for < 1 year, `month` for longer periods

### 2. Caching

- Cache analytics results on the frontend for 5-15 minutes
- Use the dashboard endpoint for initial loads to minimize requests

### 3. Filtering

- Filter by building when analyzing specific locations
- Use date filters to focus on recent data for faster queries

### 4. Pagination

- The `limit` parameter helps manage large result sets
- Start with smaller limits and increase as needed

---

## Integration Examples

### JavaScript/TypeScript

```typescript
// Fetch dashboard analytics
async function fetchDashboardAnalytics(organizationId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/dashboard?organizationId=${organizationId}`,
    {
      headers: {
        Authorization: `Bearer ${await getFirebaseToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return response.json();
}

// Fetch resolution times by category
async function fetchResolutionTimesByCategory(organizationId: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/analytics/resolution-times?organizationId=${organizationId}&groupBy=category`,
    {
      headers: {
        Authorization: `Bearer ${await getFirebaseToken()}`,
      },
    }
  );

  return response.json();
}
```

### Python

```python
import requests
from datetime import datetime, timedelta

def get_issue_trends(org_id: str, token: str, days: int = 30):
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)

    url = f"http://localhost:3001/api/analytics/trends"
    params = {
        "organizationId": org_id,
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat(),
        "groupBy": "week"
    }
    headers = {"Authorization": f"Bearer {token}"}

    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    return response.json()
```

---

## 6. Get Admin Metrics

**GET** `/api/analytics/admin-metrics`

Get comprehensive administrative metrics including Mean Time To Resolve (MTTR), high-risk buildings identification, and issue growth rate analysis.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `timeWindowDays` (optional): Analysis time window in days (default: 30)
- `comparisonTimeWindowDays` (optional): Previous period for growth comparison

**Example Request:**

```bash
curl "http://localhost:3001/api/analytics/admin-metrics?organizationId=ORG123&timeWindowDays=30&comparisonTimeWindowDays=30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "mttr": {
      "overall": 48.5,
      "byCategory": [
        {
          "category": "Structural",
          "mttr": 168.2,
          "count": 5
        },
        {
          "category": "Electrical",
          "mttr": 72.5,
          "count": 12
        },
        {
          "category": "Plumbing",
          "mttr": 24.3,
          "count": 18
        }
      ],
      "byBuilding": [
        {
          "buildingId": "old-library",
          "buildingName": "Old Library",
          "mttr": 96.8,
          "count": 8
        },
        {
          "buildingId": "engineering-bldg",
          "buildingName": "Engineering Building",
          "mttr": 42.1,
          "count": 15
        }
      ],
      "byPriority": [
        {
          "priority": "critical",
          "mttr": 12.5,
          "count": 8
        },
        {
          "priority": "high",
          "mttr": 36.2,
          "count": 15
        },
        {
          "priority": "medium",
          "mttr": 68.4,
          "count": 22
        },
        {
          "priority": "low",
          "mttr": 120.5,
          "count": 10
        }
      ],
      "trend": [
        {
          "period": "2025-W48",
          "mttr": 52.3
        },
        {
          "period": "2025-W49",
          "mttr": 45.7
        },
        {
          "period": "2025-W50",
          "mttr": 48.9
        }
      ]
    },
    "highRiskBuildings": [
      {
        "buildingId": "old-library",
        "buildingName": "Old Library",
        "riskScore": 285,
        "openIssues": 15,
        "criticalIssues": 3,
        "avgSeverity": 7.2,
        "unressolvedAge": 18.5,
        "recurringIssues": 4,
        "riskFactors": [
          "Critical Issues Present",
          "High Average Severity",
          "Long Unresolved Issues",
          "Recurring Problems",
          "High Issue Volume"
        ]
      },
      {
        "buildingId": "science-hall",
        "buildingName": "Science Hall",
        "riskScore": 198,
        "openIssues": 12,
        "criticalIssues": 2,
        "avgSeverity": 6.5,
        "unressolvedAge": 12.3,
        "recurringIssues": 2,
        "riskFactors": [
          "Critical Issues Present",
          "Recurring Problems",
          "High Issue Volume"
        ]
      }
    ],
    "issueGrowthRate": {
      "currentPeriod": {
        "total": 67,
        "open": 35,
        "resolved": 28,
        "avgPerDay": 2.23
      },
      "previousPeriod": {
        "total": 52,
        "open": 28,
        "resolved": 22,
        "avgPerDay": 1.73
      },
      "growthRate": 28.85,
      "trend": [
        {
          "period": "2025-12-15",
          "total": 3,
          "open": 2,
          "resolved": 1
        },
        {
          "period": "2025-12-16",
          "total": 5,
          "open": 3,
          "resolved": 2
        },
        {
          "period": "2025-12-17",
          "total": 2,
          "open": 1,
          "resolved": 1
        }
      ],
      "projections": {
        "nextWeek": 16,
        "nextMonth": 67
      }
    }
  },
  "metadata": {
    "timeWindowDays": 30,
    "comparisonTimeWindowDays": 30,
    "generatedAt": "2025-12-21T10:30:00.000Z"
  }
}
```

**Metrics Explanation:**

**MTTR (Mean Time To Resolve)**:

- **Overall**: Average hours to resolve issues across all categories
- **By Category**: MTTR broken down by issue type (Structural, Electrical, etc.)
- **By Building**: MTTR for each building (identifies slow-resolving locations)
- **By Priority**: MTTR by priority level (Critical should be fastest)
- **Trend**: Weekly MTTR trends to track improvement/degradation

**High-Risk Buildings**:

- **Risk Score**: Calculated from: `(openIssues × 5) + (criticalIssues × 20) + (avgSeverity × 10) + (unressolvedAge × 2) + (recurringIssues × 15)`
- **Open Issues**: Current unresolved issues count
- **Critical Issues**: Number of critical priority issues
- **Avg Severity**: Average severity rating (1-10)
- **Unresolved Age**: Average days issues remain unresolved
- **Recurring Issues**: Number of recurring problem groups
- **Risk Factors**: Specific reasons for high risk score

**Issue Growth Rate**:

- **Current Period**: Issue statistics for the specified time window
- **Previous Period**: Comparison period statistics (if provided)
- **Growth Rate**: Percentage change between periods
- **Trend**: Daily issue creation trends
- **Projections**: Linear projections based on recent trends

**Use Cases:**

1. **Performance Monitoring**: Track MTTR improvements over time
2. **Resource Allocation**: Identify high-risk buildings needing attention
3. **Capacity Planning**: Use growth rate projections for staffing
4. **SLA Compliance**: Monitor resolution times against targets
5. **Executive Reporting**: Comprehensive metrics for leadership

---

### 7. Export Analytics to CSV

**GET** `/api/analytics/export`

Export analytics data in CSV format for admin reports, audits, or external analysis.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `exportType` (required): Type of export - `issues`, `mttr`, `buildings`, or `summary`
- `startDate` (optional): Start date in ISO 8601 format (default: 30 days ago)
- `endDate` (optional): End date in ISO 8601 format (default: today)
- `buildingId` (optional): Filter by building (for `issues` export type)
- `status` (optional): Filter by status - `open`, `in_progress`, or `resolved` (for `issues` export type)

**Export Types:**

1. **issues**: All issues with details (ID, title, description, building, zone, status, priority, dates, reporter, assignee)
2. **mttr**: Mean Time to Resolve metrics per building
3. **buildings**: High-risk buildings with issue counts and risk scores
4. **summary**: Executive summary with key metrics and top issue types

**Example Request:**

```bash
# Export all issues
curl "http://localhost:3001/api/analytics/export?organizationId=ORG123&exportType=issues" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output issues.csv

# Export MTTR data
curl "http://localhost:3001/api/analytics/export?organizationId=ORG123&exportType=mttr&startDate=2025-11-01&endDate=2025-12-21" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output mttr-report.csv

# Export high-risk buildings
curl "http://localhost:3001/api/analytics/export?organizationId=ORG123&exportType=buildings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output risk-buildings.csv

# Export executive summary
curl "http://localhost:3001/api/analytics/export?organizationId=ORG123&exportType=summary" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output summary.csv
```

**Response (200):**

Returns CSV file with appropriate headers. Content type: `text/csv`.

**Issues CSV Format:**

```
Issue ID,Title,Description,Building,Zone,Status,Priority,Created At,Resolved At,Days to Resolve,Reporter,Assignee
```

**MTTR CSV Format:**

```
Building,Total Issues,Resolved Issues,Mean Time to Resolve (Days),Median Time to Resolve (Days)
```

**Buildings CSV Format:**

```
Building,Open Issues,Critical Issues,Recurring Issues,Risk Score,Risk Level
```

**Summary CSV Format:**

```
Metric,Value
Total Issues,150
Open Issues,42
...
```

---

### 8. Get Snapshot Report

**GET** `/api/analytics/snapshot`

Generate automated daily or weekly snapshot reports with key metrics and alerts.

**Query Parameters:**

- `organizationId` (required): Your organization ID
- `reportType` (required): Type of report - `daily` or `weekly`

**Report Periods:**

- **daily**: Last 24 hours vs. previous 24 hours
- **weekly**: Last 7 days vs. previous 7 days

**Example Request:**

```bash
# Daily snapshot
curl "http://localhost:3001/api/analytics/snapshot?organizationId=ORG123&reportType=daily" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Weekly snapshot
curl "http://localhost:3001/api/analytics/snapshot?organizationId=ORG123&reportType=weekly" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "reportType": "daily",
    "period": {
      "start": "2025-12-20T10:00:00Z",
      "end": "2025-12-21T10:00:00Z"
    },
    "summary": {
      "totalIssues": 8,
      "openIssues": 5,
      "resolvedIssues": 3,
      "criticalIssues": 1,
      "recurringIssues": 0,
      "avgResolutionTime": 2.5
    },
    "changes": {
      "totalIssues": 3,
      "openIssues": 1,
      "resolvedIssues": 2,
      "criticalIssues": 0,
      "recurringIssues": 0,
      "avgResolutionTime": -0.5
    },
    "topIssueTypes": [
      {
        "type": "Water Leak",
        "count": 3,
        "percentage": 37.5
      },
      {
        "type": "HVAC Issue",
        "count": 2,
        "percentage": 25.0
      },
      {
        "type": "Electrical Problem",
        "count": 2,
        "percentage": 25.0
      }
    ],
    "buildingsWithMostIssues": [
      {
        "buildingId": "engineering-bldg",
        "buildingName": "Engineering Building",
        "issueCount": 4,
        "openIssues": 2,
        "criticalIssues": 1
      },
      {
        "buildingId": "science-lab",
        "buildingName": "Science Lab",
        "issueCount": 3,
        "openIssues": 2,
        "criticalIssues": 0
      }
    ],
    "alerts": [
      {
        "type": "critical_open",
        "severity": "high",
        "message": "1 critical issues currently open",
        "buildings": ["Engineering Building"]
      },
      {
        "type": "high_growth",
        "severity": "medium",
        "message": "Issue volume increased by 60.0% compared to previous period"
      }
    ],
    "metadata": {
      "generatedAt": "2025-12-21T10:00:00Z",
      "organizationId": "ORG123"
    }
  }
}
```

**Alert Types:**

- **critical_open**: Critical issues currently open (severity: high)
- **high_growth**: Issue volume increased by >50% (severity: medium)
- **slow_resolution**: Average resolution time increased by >20% (severity: medium)
- **recurring_detected**: Recurring issues detected (severity: medium)

**Use Cases:**

1. **Daily Standup Reports**: Quick overview of yesterday's activity
2. **Weekly Executive Summary**: Higher-level trends for management
3. **Automated Monitoring**: Set up automated email reports with alerts
4. **Proactive Issue Management**: Get alerted to emerging problems early
5. **Stakeholder Communication**: Share consistent reports with campus leadership

---

## Testing

Use the seeded data to test analytics endpoints:

```bash
# Get dashboard for seeded organization
curl "http://localhost:3001/api/analytics/dashboard?organizationId=ggv-university" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get common issue types for Engineering Building
curl "http://localhost:3001/api/analytics/common-issue-types?organizationId=ggv-university&buildingId=engineering-bldg" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get weekly trends
curl "http://localhost:3001/api/analytics/trends?organizationId=ggv-university&groupBy=week" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Detect recurring issues
curl "http://localhost:3001/api/analytics/recurring-issues?organizationId=ggv-university&timeWindowDays=30&minOccurrences=2" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get admin metrics
curl "http://localhost:3001/api/analytics/admin-metrics?organizationId=ggv-university&timeWindowDays=30&comparisonTimeWindowDays=30" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Export analytics to CSV
curl "http://localhost:3001/api/analytics/export?organizationId=ggv-university&exportType=summary" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output analytics-summary.csv

# Get snapshot report
curl "http://localhost:3001/api/analytics/snapshot?organizationId=ggv-university&reportType=daily" \
  -H "Authorization: Bearer YOUR_TOKEN"
```
