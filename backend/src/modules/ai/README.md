# AI Module - Gemini API Integration

## Overview

The AI module leverages Google's Gemini Pro and Gemini Vision models to provide intelligent infrastructure issue analysis, classification, and administrative reporting. This module powers:

- **Text Issue Understanding**: Automatic classification from natural language
- **Voice Processing**: Speech-to-text with intent recognition
- **Image Analysis**: Visual infrastructure issue detection
- **Admin Summaries**: Daily reports, trend analysis, and incident documentation

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Set environment variable
export GOOGLE_GEMINI_API_KEY=your_api_key_here
```

### Running Tests

```bash
# Test all Gemini features
npm run test:gemini

# Or using tsx directly
tsx src/scripts/test-gemini.ts
```

## Core Features

### 1. Text Issue Classification

Automatically extract structured information from natural language issue descriptions:

```typescript
import { classifyIssueFromText } from "./modules/ai/gemini.service";

const result = await classifyIssueFromText(
  "The AC in room 204 is broken and it's really hot",
  { buildingName: "Engineering Building" }
);

console.log(result.category); // "HVAC"
console.log(result.severity); // 6
console.log(result.priority); // "medium"
```

**Output Structure:**

- Issue type and category
- Severity (1-10) and priority level
- Extracted location (building, room, floor, zone)
- Suggested title and structured description
- Urgency assessment
- Estimated resolution time

### 2. Voice Processing

Process voice input for issue reporting:

```typescript
import { processVoiceInput } from "./modules/ai/gemini.service";

const result = await processVoiceInput(audioBase64Data, "audio/mp3", {
  buildingName: "Library",
});

console.log(result.transcription);
console.log(result.issueClassification);
console.log(result.detectedIntent); // "report_issue", "ask_question", etc.
```

**Note**: Requires Gemini 1.5 Pro with audio capabilities for full functionality.

### 3. Image Analysis

Analyze infrastructure images for visible issues:

```typescript
import { analyzeInfrastructureImage } from "./modules/ai/gemini.service";

const analysis = await analyzeInfrastructureImage(
  "https://example.com/issue-photo.jpg",
  { buildingName: "Science Lab", expectedCategory: "Plumbing" }
);

console.log(analysis.issueDetected); // true/false
console.log(analysis.severity); // 1-10
console.log(analysis.safetyRisk); // true/false
console.log(analysis.visualIndicators); // Array of observed issues
```

**Capabilities:**

- Detects visible infrastructure damage
- Estimates severity with confidence score
- Identifies safety risks
- Provides specific visual indicators
- Recommends immediate actions

### 4. Daily Summaries

Generate comprehensive daily infrastructure reports:

```typescript
import { generateDailySummary } from "./modules/ai/gemini.service";

const summary = await generateDailySummary("org-id", new Date());

console.log(summary.executiveSummary);
console.log(summary.keyMetrics);
console.log(summary.topConcerns);
console.log(summary.recommendations);
```

**Includes:**

- Executive summary for leadership
- Key metrics (new, resolved, critical issues)
- Top concerns and risk areas
- AI-generated recommendations
- Upcoming risk predictions

### 5. Trend Explanations

Get AI-powered explanations for metric trends:

```typescript
import { generateTrendExplanation } from "./modules/ai/gemini.service";

const explanation = await generateTrendExplanation([
  {
    metric: "Total Issues",
    currentValue: 67,
    previousValue: 52,
    percentageChange: 28.85,
    timeframe: "30 days",
  },
]);

console.log(explanation.summary);
console.log(explanation.concerningTrends);
console.log(explanation.actionableInsights);
```

### 6. Incident Reports

Generate formal incident reports with AI analysis:

```typescript
import { generateIncidentReport } from "./modules/ai/gemini.service";

const report = await generateIncidentReport(issue, relatedIssues);

console.log(report.reportTitle);
console.log(report.executiveSummary);
console.log(report.rootCauseAnalysis);
console.log(report.recommendations);
```

**Report Sections:**

- Formal title and executive summary
- Incident details (what, when, where, impact)
- Timeline of events
- Root cause analysis
- Immediate actions taken
- Preventive measures
- Lessons learned
- Recommendations

## API Endpoints

All AI endpoints are available under `/api/ai`:

| Endpoint                    | Method | Description                     |
| --------------------------- | ------ | ------------------------------- |
| `/insights`                 | GET    | General infrastructure insights |
| `/risk/:buildingId`         | GET    | Building risk assessment        |
| `/summary/:issueId`         | GET    | Issue summary                   |
| `/suggestions`              | GET    | Maintenance suggestions         |
| `/chat`                     | POST   | Chat with AI assistant          |
| `/classify-text`            | POST   | **Text issue classification**   |
| `/process-voice`            | POST   | **Voice input processing**      |
| `/analyze-image`            | POST   | **Image analysis**              |
| `/daily-summary`            | GET    | **Daily admin summary**         |
| `/trend-explanation`        | POST   | **Trend analysis**              |
| `/incident-report/:issueId` | GET    | **Incident report generation**  |

**Bold** endpoints are newly added Gemini features.

## Full Documentation

For complete API documentation with examples, request/response formats, and use cases:

📚 **[Gemini AI API Documentation](../../docs/GEMINI_AI_API.md)**

## Architecture

```
ai/
├── gemini.service.ts      # Core Gemini AI functions
├── ai.controller.ts       # Express request handlers
├── routes.ts              # API route definitions
└── README.md              # This file
```

### Service Layer (gemini.service.ts)

**Text Understanding:**

- `classifyIssueFromText()` - Extract structured data from text
- `generateInsights()` - Core AI text generation

**Voice & Audio:**

- `processVoiceInput()` - Speech-to-text + classification
- Supports audio/mp3, audio/wav, audio/webm

**Image Analysis:**

- `analyzeInfrastructureImage()` - Visual issue detection
- `analyzeIssueImage()` - Legacy image analysis
- Uses Gemini Vision (gemini-1.5-flash)

**Admin Reporting:**

- `generateDailySummary()` - Comprehensive daily reports
- `generateTrendExplanation()` - Explain metric trends
- `generateIncidentReport()` - Formal incident documentation

**Risk & Patterns:**

- `analyzeIssuePatterns()` - Pattern detection
- `generateRiskAssessment()` - Location risk scoring
- `generateFailurePrediction()` - Predictive analysis

**Utilities:**

- `calculatePriority()` - Smart priority calculation
- `suggestMaintenanceActions()` - Action recommendations

### Controller Layer (ai.controller.ts)

Express route handlers that:

1. Validate request parameters
2. Call service functions
3. Format responses
4. Handle errors

### Routes (routes.ts)

API endpoint definitions with:

- Rate limiting (10 req/min)
- Request validation
- Authentication middleware
- Error handling

## Configuration

### Environment Variables

```env
# Required
GOOGLE_GEMINI_API_KEY=your_api_key_here

# Optional
GEMINI_MODEL=gemini-pro              # Text model
GEMINI_VISION_MODEL=gemini-1.5-flash # Vision model
AI_RATE_LIMIT=10                     # Requests per minute
```

### Rate Limiting

All AI endpoints are rate-limited to prevent API abuse:

- **10 requests per minute** per IP address
- Configurable via `aiRateLimiter` middleware
- 429 response when limit exceeded

## Usage Examples

### Example 1: Auto-Classify User Input

```typescript
// Frontend: User types issue description
const userInput = "water coming through ceiling in room 301";

// Backend: Classify and create issue
const classification = await fetch("/api/ai/classify-text", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: userInput,
    buildingName: "Dormitory B",
  }),
});

// Auto-populate issue form
const issueData = {
  title: classification.suggestedTitle,
  description: classification.structuredDescription,
  category: classification.category,
  severity: classification.severity,
  priority: classification.priority,
  // ...
};
```

### Example 2: Image-Based Reporting

```typescript
// User uploads photo
const imageUrl = await uploadToStorage(photoFile);

// Analyze with AI
const analysis = await fetch("/api/ai/analyze-image", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ imageUrl, buildingName: "Science Lab" }),
});

// Create issue if problem detected
if (analysis.issueDetected && analysis.severity >= 7) {
  await createIssue({
    ...analysis,
    priority: analysis.immediateActionRequired ? "critical" : "high",
  });

  // Alert if safety risk
  if (analysis.safetyRisk) {
    await sendSafetyAlert(analysis);
  }
}
```

### Example 3: Automated Daily Reports

```typescript
// Schedule daily at 8 AM
cron.schedule("0 8 * * *", async () => {
  const summary = await fetch(`/api/ai/daily-summary?organizationId=${orgId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  // Email to administrators
  await sendEmail({
    to: adminEmails,
    subject: `Daily Infrastructure Summary - ${summary.date}`,
    body: formatSummaryEmail(summary),
  });

  // Post to Slack
  await postToSlack({
    channel: "#facilities",
    text: summary.executiveSummary,
    attachments: [{ fields: summary.keyMetrics }],
  });
});
```

## Testing

### Manual Testing

```bash
# Test text classification
curl -X POST http://localhost:3001/api/ai/classify-text \
  -H "Content-Type: application/json" \
  -d '{"text": "AC not working in room 204"}'

# Test daily summary
curl http://localhost:3001/api/ai/daily-summary?organizationId=test-org

# Test incident report
curl http://localhost:3001/api/ai/incident-report/issue-123
```

### Automated Testing

```bash
# Run comprehensive test suite
npm run test:gemini

# Tests include:
# - Text classification with various inputs
# - Daily summary generation
# - Trend explanation
# - Incident report generation
# - Priority calculation
```

## Error Handling

All AI functions include robust error handling:

```typescript
try {
  const classification = await classifyIssueFromText(text);
} catch (error) {
  // Fallback to rule-based classification
  const fallback = intelligentFallback(text);
}
```

**Fallback Strategies:**

- Text classification uses keyword matching
- Image analysis returns basic structure
- Summaries use template-based generation
- Always returns valid response structure

## Performance & Costs

### Response Times

- Text classification: 1-3 seconds
- Image analysis: 2-4 seconds
- Daily summary: 3-5 seconds
- Incident report: 2-4 seconds

### API Costs (Approximate)

- Text requests: ~$0.001 per call
- Image analysis: ~$0.002 per call
- Voice processing: ~$0.005 per call (when available)

**Monthly estimate**: $50-200 depending on usage volume.

## Troubleshooting

### "Gemini API error"

- Check `GOOGLE_GEMINI_API_KEY` is set correctly
- Verify API key has necessary permissions
- Check API quota limits

### "Rate limit exceeded"

- Default: 10 requests/minute per IP
- Implement client-side throttling
- Consider caching AI responses

### "Failed to parse JSON response"

- AI sometimes returns non-JSON text
- Fallback logic handles this automatically
- Check prompts if consistent failures

## Future Enhancements

- [ ] Full audio processing with Gemini 1.5 Pro
- [ ] Multi-modal analysis (text + image combined)
- [ ] Conversation memory for chat feature
- [ ] Custom fine-tuned models
- [ ] Streaming responses for long-form content
- [ ] Multi-language support

## Resources

- [Gemini API Documentation](https://ai.google.dev/docs)
- [Google AI Studio](https://makersuite.google.com/)
- [CIIS API Documentation](../../docs/GEMINI_AI_API.md)

---

**Last Updated**: December 21, 2025
**Version**: 1.0.0
**Gemini SDK**: @google/generative-ai ^0.24.1
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

````

**Example:**

```bash
curl http://localhost:3001/api/ai/risk/building_001
````

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
