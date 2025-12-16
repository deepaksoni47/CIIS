# AI Module - API Endpoints

## Overview

The AI module uses Google Gemini API to provide intelligent insights, risk assessments, and maintenance recommendations for campus infrastructure.

## API Endpoints

### 1. General Insights

**GET** `/api/ai/insights`

Analyzes recent issues and generates comprehensive insights about patterns, trends, and recommendations.

**Response:**

```json
{
  "success": true,
  "data": {
    "insights": "Based on the analysis of 20 recent issues...",
    "analyzedIssues": 20,
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl http://localhost:3001/api/ai/insights
```

---

### 2. Building Risk Assessment

**GET** `/api/ai/risk/:buildingId`

Generates AI-powered risk assessment for a specific building based on recent issues.

**Parameters:**

- `buildingId` (path) - Building identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "buildingId": "building_001",
    "buildingName": "Engineering Building",
    "riskScore": 65,
    "riskLevel": "HIGH",
    "reasoning": "Multiple structural issues detected in the past month...",
    "recentIssuesCount": 8,
    "assessmentDate": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl http://localhost:3001/api/ai/risk/building_001
```

---

### 3. Issue Summary

**GET** `/api/ai/summary/:issueId`

Generates a professional natural language summary of a specific issue.

**Parameters:**

- `issueId` (path) - Issue identifier

**Response:**

```json
{
  "success": true,
  "data": {
    "issueId": "issue_001",
    "summary": "A high-severity structural crack has been identified in the Engineering Building...",
    "originalIssue": {
      "id": "issue_001",
      "category": "Structural",
      "severity": 8,
      "description": "Large crack in load-bearing wall"
    }
  }
}
```

**Example:**

```bash
curl http://localhost:3001/api/ai/summary/issue_001
```

---

### 4. Maintenance Suggestions

**GET** `/api/ai/suggestions?category=Structural&severity=8`

Get AI-generated maintenance action recommendations.

**Query Parameters:**

- `category` (string) - Issue category (e.g., Structural, Electrical, Plumbing, HVAC)
- `severity` (number) - Severity level (1-10)

**Response:**

```json
{
  "success": true,
  "data": {
    "category": "Structural",
    "severity": 8,
    "suggestions": [
      "Immediate structural engineer assessment required",
      "Evacuate affected areas if necessary",
      "Document crack size and location with photos",
      "Schedule emergency repair contractor",
      "Set up monitoring system to track crack progression"
    ]
  }
}
```

**Example:**

```bash
curl "http://localhost:3001/api/ai/suggestions?category=Structural&severity=8"
```

---

### 5. AI Chat Assistant

**POST** `/api/ai/chat`

Interactive chat with AI assistant for infrastructure-related questions.

**Request Body:**

```json
{
  "message": "What should I do about recurring water leaks in the Science Hall?"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "userMessage": "What should I do about recurring water leaks?",
    "aiResponse": "For recurring water leaks, I recommend: 1) Conduct thorough inspection...",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Example:**

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What should I do about recurring water leaks?"}'
```

---

## Rate Limits

- **Gemini API Free Tier:** 15 requests per minute
- Handle rate limiting errors gracefully
- Consider implementing request queuing for high traffic

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common Status Codes:**

- `400` - Bad Request (missing parameters)
- `404` - Resource Not Found
- `500` - Internal Server Error (AI API failure)

## Testing with Seeded Data

After running the seed script, you have:

- 3 buildings (Engineering, Science Hall, Library)
- 20 sample issues across 4 categories

Try these test commands:

```bash
# Get general insights from all issues
curl http://localhost:3001/api/ai/insights

# Assess risk for specific building
curl http://localhost:3001/api/ai/risk/engineering-bldg

# Get maintenance suggestions
curl "http://localhost:3001/api/ai/suggestions?category=Structural&severity=8"

# Chat with AI
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How can I prevent HVAC system failures?"}'
```

## Implementation Notes

### Gemini Service (`gemini.service.ts`)

- `generateInsights()` - Core Gemini API wrapper
- `analyzeIssuePatterns()` - Pattern analysis for multiple issues
- `generateRiskAssessment()` - Building risk scoring
- `generateIssueSummary()` - Natural language summaries
- `suggestMaintenanceActions()` - Action recommendations

### AI Controller (`ai.controller.ts`)

- Integrates with Firestore to fetch issue/building data
- Handles request validation and error responses
- Formats AI responses for frontend consumption

### Routes (`routes.ts`)

- Express router configuration
- RESTful endpoint definitions
- Currently public (TODO: add authentication middleware)

## Future Enhancements

1. **Predictive Analytics**
   - Predict issue recurrence probability
   - Forecast maintenance costs
   - Identify failure patterns

2. **Automated Reports**
   - Daily/weekly/monthly summary reports
   - Export to PDF with charts
   - Email notifications

3. **Image Analysis**
   - Use Gemini Vision to analyze infrastructure photos
   - Automatic damage assessment
   - Visual severity estimation

4. **Natural Language Queries**
   - Query issues with conversational language
   - "Show me all high-severity electrical issues from last month"
   - Semantic search across issue descriptions
