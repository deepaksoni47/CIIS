# Priority Engine API Documentation

## Overview

The **Priority Engine** is a deterministic scoring system that calculates priority scores (0-100) for campus infrastructure issues based on multiple weighted factors. It provides transparent, explainable prioritization for issue management.

---

## Base URL

```
http://localhost:3001/api/priority
```

## Authentication

Most endpoints require authentication (except `/explain`). Include Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

---

## Scoring Algorithm

### Weighted Components (Total: 100%)

1. **Category Score** (25%) - Base priority by issue type
2. **Severity Score** (20%) - 1-10 scale with category multipliers
3. **Impact Score** (25%) - People affected, area, access blockage
4. **Urgency Score** (15%) - Time sensitivity, recurrence
5. **Context Score** (10%) - Timing (exams, semester, time of day)
6. **Historical Score** (5%) - Past escalation rate, resolution time

### Priority Levels

| Score Range | Priority Level  | SLA Target  |
| ----------- | --------------- | ----------- |
| 80-100      | **CRITICAL** ⚠️ | 2-4 hours   |
| 60-79       | **HIGH** 🔴     | 8-12 hours  |
| 40-59       | **MEDIUM** 🟡   | 24-48 hours |
| 0-39        | **LOW** 🟢      | 48-72 hours |

### Category Baselines

| Category    | Base Score | Multiplier | Default SLA |
| ----------- | ---------- | ---------- | ----------- |
| Safety      | 85         | 1.5x       | 2 hours     |
| Structural  | 80         | 1.4x       | 4 hours     |
| Electrical  | 70         | 1.3x       | 8 hours     |
| Plumbing    | 65         | 1.2x       | 12 hours    |
| HVAC        | 50         | 1.1x       | 24 hours    |
| Network     | 45         | 1.15x      | 16 hours    |
| Maintenance | 40         | 1.0x       | 48 hours    |
| Cleanliness | 30         | 0.9x       | 24 hours    |
| Furniture   | 25         | 0.8x       | 72 hours    |
| Other       | 35         | 1.0x       | 48 hours    |

---

## Endpoints

### 1. Calculate Priority Score

**POST** `/api/priority/calculate`

Calculate priority score for a single issue with full breakdown.

**Request Body:**

```json
{
  "category": "Safety | Structural | Electrical | Plumbing | HVAC | Network | Maintenance | Cleanliness | Furniture | Other",
  "severity": 7,
  "description": "Detailed description (optional)",

  // Location factors
  "buildingId": "building-123",
  "roomId": "room-456",
  "occupancy": 150,
  "affectedArea": 200,

  // Impact flags
  "blocksAccess": true,
  "safetyRisk": false,
  "criticalInfrastructure": true,
  "affectsAcademics": true,

  // Time context
  "reportedAt": "2025-12-18T10:30:00Z",
  "examPeriod": true,
  "currentSemester": true,
  "timeOfDay": "morning",
  "dayOfWeek": "weekday",

  // Historical data
  "isRecurring": false,
  "previousOccurrences": 0,
  "avgResolutionTime": 24,
  "escalationRate": 0.3
}
```

**Required Fields:**

- `category`
- `reportedAt` (defaults to now if not provided)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "score": 78,
    "priority": "high",
    "confidence": 0.85,
    "breakdown": {
      "categoryScore": 85,
      "severityScore": 91,
      "impactScore": 75,
      "urgencyScore": 55,
      "contextScore": 70,
      "historicalScore": 58
    },
    "reasoning": [
      "Safety issues are inherently high-priority due to safety concerns",
      "High occupancy area (150 people affected)",
      "Blocks access to critical area (+25 points)",
      "Disrupts academic activities (+15 points)",
      "Exam period - elevated priority (+30 points)",
      "Critical infrastructure affected (+15 points)",
      "🔴 HIGH priority - Address within SLA window"
    ],
    "recommendedSLA": 8
  }
}
```

---

### 2. Batch Calculate

**POST** `/api/priority/batch`

Calculate priority scores for multiple issues at once.

**Request Body:**

```json
{
  "inputs": [
    {
      "category": "HVAC",
      "severity": 6,
      "occupancy": 80,
      "examPeriod": true,
      "reportedAt": "2025-12-18T10:00:00Z"
    },
    {
      "category": "Furniture",
      "severity": 3,
      "occupancy": 10,
      "reportedAt": "2025-12-17T15:00:00Z"
    }
  ]
}
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      /* First priority score result */
    },
    {
      /* Second priority score result */
    }
  ],
  "count": 2
}
```

---

### 3. Recalculate Priority

**POST** `/api/priority/recalculate`

Recalculate priority with updated context (e.g., exam period started, more people affected).

**Request Body:**

```json
{
  "originalInput": {
    "category": "HVAC",
    "severity": 5,
    "occupancy": 50,
    "reportedAt": "2025-12-17T10:00:00Z"
  },
  "contextUpdates": {
    "examPeriod": true,
    "occupancy": 120,
    "affectsAcademics": true
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "score": 72,
    "priority": "high",
    "confidence": 0.8,
    "breakdown": {
      /* ... */
    },
    "reasoning": [
      /* ... */
    ],
    "recommendedSLA": 12
  },
  "message": "Priority recalculated with updated context"
}
```

---

### 4. Explain Scoring Algorithm

**GET** `/api/priority/explain`

Get detailed explanation of the scoring algorithm (public endpoint).

**Response (200):**

```json
{
  "success": true,
  "data": {
    "description": "Deterministic priority scoring engine for campus infrastructure issues",
    "algorithm": {
      "weights": {
        "categoryScore": "25%",
        "severityScore": "20%",
        "impactScore": "25%",
        "urgencyScore": "15%",
        "contextScore": "10%",
        "historicalScore": "5%"
      },
      "scoreRanges": {
        "critical": "80-100",
        "high": "60-79",
        "medium": "40-59",
        "low": "0-39"
      }
    },
    "categoryBaselines": {
      /* Category weights */
    },
    "boosters": {
      "safetyRisk": "+20 points",
      "criticalInfrastructure": "+15 points",
      "blocksAccess": "+25 points to impact",
      "affectsAcademics": "+15 points to impact",
      "examPeriod": "+30 points to context",
      "recurring": "+20 points to urgency",
      "highOccupancy": "Up to +40 points to impact"
    },
    "inputs": {
      "required": ["category", "reportedAt"],
      "optional": [
        /* ... */
      ]
    }
  }
}
```

---

### 5. Simulate Scenarios

**POST** `/api/priority/simulate`

Run predefined test scenarios to see how different factors affect scores.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "scenario": "Critical Safety Issue - Fire Exit Blocked",
      "input": {
        /* ... */
      },
      "result": {
        "score": 95,
        "priority": "critical",
        "reasoning": [
          /* ... */
        ]
      }
    },
    {
      "scenario": "Structural Damage - Ceiling Crack",
      "input": {
        /* ... */
      },
      "result": {
        "score": 88,
        "priority": "critical"
      }
    },
    {
      "scenario": "AC Not Working During Exam",
      "input": {
        /* ... */
      },
      "result": {
        "score": 72,
        "priority": "high"
      }
    },
    {
      "scenario": "Recurring Network Issue",
      "input": {
        /* ... */
      },
      "result": {
        "score": 65,
        "priority": "high"
      }
    },
    {
      "scenario": "Minor Furniture Damage - Weekend",
      "input": {
        /* ... */
      },
      "result": {
        "score": 28,
        "priority": "low"
      }
    },
    {
      "scenario": "Power Outage - Critical Infrastructure",
      "input": {
        /* ... */
      },
      "result": {
        "score": 92,
        "priority": "critical"
      }
    }
  ],
  "message": "Priority simulation completed"
}
```

---

## Priority Boosters & Penalties

### 🚀 Boosters (Increase Score)

- **Safety Risk**: +20 points (category score)
- **Critical Infrastructure**: +15 points (category score)
- **Blocks Access**: +25 points (impact score)
- **Affects Academics**: +15 points (impact score)
- **Exam Period**: +30 points (context score)
- **Active Semester**: +10 points (context score)
- **Peak Hours** (morning/afternoon): +10 points (context score)
- **Recurring Issue**: +20 points (urgency score)
- **High Occupancy** (>100 people): +40 points (impact score)
- **Large Area** (>500 sqm): +20 points (impact score)
- **Previous Occurrences**: +3 points each (urgency score)
- **High Escalation Rate**: Up to +30 points (historical score)
- **Slow Historical Resolution**: Up to +20 points (historical score)

### 📉 Penalties (Decrease Score)

- **Weekend** (non-critical): -15 points (context score)
- **Night Time** (non-critical): -10 points (context score)
- **Lingering Issue** (>72 hours old): -10 points (urgency score)

---

## Integration Examples

### Example 1: Calculate Safety Issue Priority

```bash
curl -X POST http://localhost:3001/api/priority/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Safety",
    "severity": 9,
    "reportedAt": "2025-12-18T10:00:00Z",
    "safetyRisk": true,
    "blocksAccess": true,
    "occupancy": 200,
    "affectsAcademics": true,
    "currentSemester": true,
    "examPeriod": true
  }'

# Expected Result:
# Score: 93-95 (CRITICAL)
# Recommended SLA: 2 hours
```

### Example 2: Recalculate When Context Changes

```bash
# Original issue: AC not working, 50 people affected
curl -X POST http://localhost:3001/api/priority/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "HVAC",
    "severity": 5,
    "occupancy": 50,
    "reportedAt": "2025-12-17T10:00:00Z"
  }'
# Result: Score ~48 (MEDIUM)

# Situation changes: Exam starts, room now has 150 students
curl -X POST http://localhost:3001/api/priority/recalculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "originalInput": {
      "category": "HVAC",
      "severity": 5,
      "occupancy": 50,
      "reportedAt": "2025-12-17T10:00:00Z"
    },
    "contextUpdates": {
      "examPeriod": true,
      "occupancy": 150,
      "affectsAcademics": true
    }
  }'
# Result: Score ~72 (HIGH) - Priority escalated!
```

### Example 3: Get Algorithm Explanation (Public)

```bash
curl http://localhost:3001/api/priority/explain
```

---

## Use Cases

### 1. **Issue Creation**

When a new issue is reported, automatically calculate priority:

```typescript
const priorityResult = await fetch("/api/priority/calculate", {
  method: "POST",
  body: JSON.stringify({
    category: issue.category,
    severity: issue.severity,
    occupancy: issue.occupancy,
    reportedAt: new Date(),
  }),
});
// Use priorityResult.score and priorityResult.priority for issue
```

### 2. **Dynamic Reprioritization**

Recalculate when context changes (e.g., exams start):

```typescript
// All open HVAC issues need recalculation during exam week
const hvacIssues = await getOpenIssuesByCategory("HVAC");
const recalculated = await fetch("/api/priority/batch", {
  method: "POST",
  body: JSON.stringify({
    inputs: hvacIssues.map((issue) => ({
      ...issue.originalContext,
      examPeriod: true,
      currentSemester: true,
    })),
  }),
});
```

### 3. **Priority Queue Sorting**

Use scores to build work queues:

```typescript
const issues = await getAllOpenIssues();
// Sort by aiRiskScore (which comes from priority engine)
issues.sort((a, b) => b.aiRiskScore - a.aiRiskScore);
```

---

## Score Breakdown Interpretation

### Example Breakdown:

```json
{
  "categoryScore": 85, // Safety = high base (85)
  "severityScore": 91, // Severity 9 × 1.5 multiplier
  "impactScore": 75, // 200 people + blocks access
  "urgencyScore": 55, // Fresh issue, no recurrence
  "contextScore": 70, // Exam period + peak hours
  "historicalScore": 50 // No historical data
}
```

**Final Score Calculation:**

```
Score = (85 × 0.25) + (91 × 0.20) + (75 × 0.25) + (55 × 0.15) + (70 × 0.10) + (50 × 0.05)
      = 21.25 + 18.2 + 18.75 + 8.25 + 7 + 2.5
      = 75.95 ≈ 76 (HIGH priority)
```

---

## Best Practices

1. **Provide Rich Context**: More data = higher confidence scores
2. **Update Context**: Recalculate when situation changes
3. **Use Batch Operations**: Efficient for bulk recalculation
4. **Monitor SLA Compliance**: Use `recommendedSLA` for tracking
5. **Explain Decisions**: Use `reasoning` array for transparency
6. **Test Scenarios**: Use `/simulate` to validate scoring logic

---

## Confidence Scores

The engine calculates a confidence score (0-1) based on available data:

- **Base**: 0.5
- **+0.1**: Severity provided
- **+0.1**: Occupancy provided
- **+0.05**: Affected area provided
- **+0.1**: Historical resolution time available
- **+0.1**: Escalation rate available
- **+0.05**: Previous occurrences tracked

**Example:** Issue with category, severity, occupancy, and escalation rate = 0.8 confidence

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Missing parameter",
  "message": "category is required"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "User not authenticated"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "Failed to calculate priority"
}
```

---

## Integration with Issues API

The Priority Engine is automatically used when creating issues:

```bash
# Create issue with priority context
curl -X POST http://localhost:3001/api/issues \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "ggv",
    "buildingId": "eng-block",
    "title": "AC Broken During Exam",
    "description": "AC stopped working",
    "category": "HVAC",
    "latitude": 22.131,
    "longitude": 82.149,

    // Priority context (optional but recommended)
    "occupancy": 150,
    "affectsAcademics": true,
    "examPeriod": true,
    "currentSemester": true
  }'

# Response includes auto-calculated priority:
# {
#   "priority": "high",
#   "aiRiskScore": 72,
#   ...
# }
```

---

## Notes

- All calculations are **deterministic** - same inputs always produce same outputs
- No ML/AI model required - pure mathematical algorithm
- Transparent and explainable for stakeholders
- Can be tuned by adjusting category weights and multipliers
- Confidence scores indicate data quality
