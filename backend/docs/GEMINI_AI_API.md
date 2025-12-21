# Gemini AI API Documentation

## Overview

The Gemini AI API provides intelligent infrastructure issue analysis, classification, and administrative reporting capabilities powered by Google's Gemini Pro and Gemini Vision models. This API enables:

- **Text Issue Understanding**: Automatic classification and structured extraction from natural language
- **Voice Processing**: Speech-to-text conversion with intent recognition
- **Image Analysis**: Visual infrastructure issue detection and severity assessment
- **Admin Summaries**: Daily reports, trend explanations, and incident documentation

## Authentication

All AI endpoints require authentication. Include a valid Firebase ID token in the Authorization header:

```
Authorization: Bearer <firebase-id-token>
```

## Rate Limiting

AI endpoints are rate-limited to prevent abuse and manage API costs. Current limits:

- **10 requests per minute** per IP address
- Applies to all `/api/ai/*` endpoints

---

## Endpoints

### 1. Text Issue Classification

**POST** `/api/ai/classify-text`

Classify infrastructure issues from natural language text input. Automatically extracts issue type, severity, location, priority, and provides structured JSON output.

**Request Body:**

```json
{
  "text": "The AC in room 204 of the Engineering Building is not working. It's very hot and uncomfortable. This has been an issue for 2 days now.",
  "buildingName": "Engineering Building",
  "zone": "Second Floor",
  "reporterName": "John Doe"
}
```

**Parameters:**

- `text` (required): Issue description in natural language (10-5000 chars)
- `buildingName` (optional): Building context for better location extraction
- `zone` (optional): Zone/area context
- `reporterName` (optional): Reporter's name for records

**Response (200):**

```json
{
  "success": true,
  "data": {
    "originalText": "The AC in room 204...",
    "classification": {
      "issueType": "AC Not Working",
      "category": "HVAC",
      "severity": 6,
      "priority": "medium",
      "extractedLocation": {
        "building": "Engineering Building",
        "room": "204",
        "floor": "2",
        "zone": "Second Floor"
      },
      "suggestedTitle": "AC Not Working in Room 204",
      "structuredDescription": "Air conditioning system failure in room 204 of Engineering Building. Unit is not providing cooling, causing uncomfortable temperatures. Issue has persisted for 2 days.",
      "urgency": "Moderate priority. HVAC issue affecting comfort and productivity.",
      "estimatedResolutionTime": "4-8 hours"
    },
    "timestamp": "2025-12-21T10:00:00Z"
  }
}
```

**Classification Details:**

- **Severity Scale**: 1-10 (1=minor, 10=critical emergency)
- **Priority Levels**: `low`, `medium`, `high`, `critical`
- **Categories**: Structural, Electrical, Plumbing, HVAC, Safety, Maintenance, Cleanliness, Network, Furniture, Other
- **Location Extraction**: Automatically identifies building, room, floor, zone from text

**Use Cases:**

1. **Mobile App Submissions**: Users describe issues in natural language
2. **Email/Chat Integration**: Parse infrastructure complaints from emails
3. **Ticket Creation**: Auto-populate issue forms with AI classification
4. **Quality Control**: Validate user-submitted categories and severity

**Example Request:**

```bash
curl -X POST "http://localhost:3001/api/ai/classify-text" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "There is a water leak in the bathroom on the 3rd floor",
    "buildingName": "Science Lab"
  }'
```

---

### 2. Voice Processing

**POST** `/api/ai/process-voice`

Process voice input for infrastructure issue reporting. Converts speech to text, extracts intent, and classifies the issue.

**Request Body:**

```json
{
  "audioBase64": "base64_encoded_audio_data_here",
  "mimeType": "audio/mp3",
  "buildingName": "Library",
  "zone": "Main Hall",
  "reporterName": "Jane Smith"
}
```

**Parameters:**

- `audioBase64` (required): Base64-encoded audio data
- `mimeType` (optional): Audio format - `audio/mp3`, `audio/wav`, or `audio/webm` (default: audio/mp3)
- `buildingName` (optional): Building context
- `zone` (optional): Zone context
- `reporterName` (optional): Reporter's name

**Response (200):**

```json
{
  "success": true,
  "data": {
    "transcription": "The lights in the library main hall are flickering constantly. It's very annoying and might be dangerous.",
    "confidence": 0.92,
    "issueClassification": {
      "issueType": "Flickering Lights",
      "category": "Electrical",
      "severity": 7,
      "priority": "high",
      "extractedLocation": {
        "building": "Library",
        "zone": "Main Hall"
      },
      "suggestedTitle": "Flickering Lights in Library Main Hall",
      "structuredDescription": "Electrical issue causing constant light flickering in library main hall. Potential safety hazard requiring immediate attention.",
      "urgency": "High priority electrical issue with potential safety implications.",
      "estimatedResolutionTime": "2-4 hours"
    },
    "detectedIntent": "report_issue",
    "suggestedAction": "Create new issue ticket"
  }
}
```

**Intent Types:**

- `report_issue`: User is reporting an infrastructure problem
- `ask_question`: User is asking about facilities
- `request_help`: User needs assistance
- `other`: Unclear intent

**Note**: Voice processing requires Gemini 1.5 Pro with audio capabilities. Current implementation provides placeholder functionality. Update to Gemini 1.5 Pro for full audio support.

**Use Cases:**

1. **Mobile Voice Reporting**: Users can speak their issues instead of typing
2. **Call Center Integration**: Process phone reports automatically
3. **Accessibility**: Support for users who prefer voice input
4. **Field Reporting**: Quick issue reporting without typing

**Example Request:**

```bash
# First, convert audio file to base64
AUDIO_BASE64=$(base64 -i recording.mp3)

curl -X POST "http://localhost:3001/api/ai/process-voice" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"audioBase64\": \"$AUDIO_BASE64\",
    \"mimeType\": \"audio/mp3\",
    \"buildingName\": \"Engineering Building\"
  }"
```

---

### 3. Image Analysis

**POST** `/api/ai/analyze-image`

Analyze infrastructure issues from images using Gemini Vision. Detects visible damage, estimates severity, and provides recommendations.

**Request Body:**

```json
{
  "imageUrl": "https://storage.googleapis.com/bucket/issue-image.jpg",
  "expectedCategory": "Plumbing",
  "buildingName": "Dormitory A",
  "additionalContext": "Water damage reported by resident on floor 5"
}
```

**Parameters:**

- `imageUrl` (required): Publicly accessible image URL
- `expectedCategory` (optional): Expected issue category for context
- `buildingName` (optional): Building name for context
- `additionalContext` (optional): Additional context about the issue (max 500 chars)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://storage.googleapis.com/bucket/issue-image.jpg",
    "analysis": {
      "issueDetected": true,
      "description": "Visible water damage on ceiling with dark staining and paint peeling. Water leak appears active with visible moisture. Ceiling tiles are sagging and discolored, indicating prolonged water exposure.",
      "severity": 8,
      "severityConfidence": 0.88,
      "suggestedCategory": "Plumbing",
      "visualIndicators": [
        "Dark water staining on ceiling",
        "Peeling paint and plaster",
        "Sagging ceiling tiles",
        "Visible moisture",
        "Discoloration pattern consistent with active leak"
      ],
      "safetyRisk": true,
      "immediateActionRequired": true,
      "recommendations": [
        "Immediately shut off water supply to affected area",
        "Evacuate rooms below if ceiling collapse risk exists",
        "Contact emergency plumbing service",
        "Document extent of damage for insurance",
        "Set up dehumidifiers to prevent mold growth",
        "Inspect structural integrity of ceiling"
      ],
      "structuredAnalysis": {
        "damageType": "Active water leak with structural damage",
        "affectedArea": "Ceiling and potentially underlying structure",
        "estimatedScope": "large",
        "urgencyLevel": "critical"
      }
    },
    "timestamp": "2025-12-21T10:15:00Z"
  }
}
```

**Analysis Fields:**

- **issueDetected**: Boolean indicating if infrastructure issue is visible
- **description**: Detailed description of observed issue
- **severity**: 1-10 scale (AI-assessed based on visual evidence)
- **severityConfidence**: 0-1 confidence in severity rating
- **visualIndicators**: Specific damage elements observed
- **safetyRisk**: Whether issue poses immediate safety hazard
- **immediateActionRequired**: Whether urgent response is needed
- **structuredAnalysis**: Categorized damage assessment

**Use Cases:**

1. **Mobile Photo Submission**: Users take photos of issues
2. **Severity Verification**: Confirm human-reported severity with AI
3. **Documentation**: Automatic issue documentation from images
4. **Insurance Claims**: Detailed damage analysis for claims
5. **Remote Assessment**: Evaluate issues without site visit

**Example Request:**

```bash
curl -X POST "http://localhost:3001/api/ai/analyze-image" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/ceiling-leak.jpg",
    "expectedCategory": "Plumbing",
    "buildingName": "Student Housing B"
  }'
```

---

### 4. Daily Summary

**GET** `/api/ai/daily-summary`

Generate comprehensive daily infrastructure summary for administrators with AI-powered insights.

**Query Parameters:**

- `organizationId` (required): Organization ID
- `date` (optional): Date for summary in ISO format (default: today)

**Example Request:**

```bash
curl "http://localhost:3001/api/ai/daily-summary?organizationId=ggv-university&date=2025-12-21" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "date": "2025-12-21",
    "executiveSummary": "Campus infrastructure experienced moderate activity with 12 new issues reported today. Three critical issues require immediate attention: an electrical failure in the Science Lab, a major water leak in Dormitory C, and a structural concern in the Engineering Building. Overall, the day saw 8 resolutions, bringing the total active issue count to 45. The average severity of new issues (6.8/10) is higher than the 30-day average, indicating a potential uptick in serious problems. Primary concerns center around aging electrical systems and plumbing infrastructure in buildings over 20 years old.\n\nDespite the critical issues, maintenance teams have shown strong responsiveness with same-day resolution of 5 issues. However, the growing backlog of medium-priority issues in the Library and Administration Building may require additional resource allocation to prevent escalation.",
    "keyMetrics": {
      "totalIssues": 45,
      "newIssues": 12,
      "resolvedIssues": 8,
      "criticalIssues": 3,
      "averageSeverity": 6.8
    },
    "topConcerns": [
      "3 critical issues requiring immediate response",
      "Electrical systems showing increased failure rate",
      "Plumbing issues in older buildings trending upward",
      "Average severity 15% higher than monthly average"
    ],
    "trendAnalysis": "Compared to the previous 7-day average of 9 new issues per day, today's volume represents a 33% increase. The ratio of resolved to new issues (8:12) indicates that the backlog is growing. Critical issue frequency has doubled compared to last week, suggesting potential systemic issues in aging infrastructure. Electrical and plumbing categories account for 60% of today's reports.",
    "recommendations": [
      "Prioritize immediate response to 3 critical issues",
      "Conduct preventive electrical system audit in Science Lab and Engineering Building",
      "Schedule comprehensive plumbing inspection in Dormitory C and adjacent buildings",
      "Consider temporary resource reallocation to address growing medium-priority backlog",
      "Implement proactive monitoring for aging infrastructure systems"
    ],
    "upcomingRisks": [
      "Potential electrical grid issues in Science Lab area",
      "Water damage escalation risk in Dormitory C if not addressed within 24 hours",
      "Structural assessment required for Engineering Building before winter weather",
      "Medium-priority backlog may escalate if not addressed within 5-7 days"
    ]
  }
}
```

**Use Cases:**

1. **Morning Briefings**: Daily status updates for facility managers
2. **Executive Reports**: Leadership visibility into infrastructure health
3. **Resource Planning**: Identify areas needing staff allocation
4. **Trend Monitoring**: Track daily patterns and anomalies
5. **Automated Email Reports**: Send daily summaries to stakeholders

---

### 5. Trend Explanation

**POST** `/api/ai/trend-explanation`

Generate AI-powered explanations for infrastructure trends and metrics.

**Request Body:**

```json
{
  "trends": [
    {
      "metric": "Total Issues",
      "currentValue": 67,
      "previousValue": 52,
      "percentageChange": 28.85,
      "timeframe": "30 days"
    },
    {
      "metric": "Average Resolution Time",
      "currentValue": 4.2,
      "previousValue": 3.8,
      "percentageChange": 10.53,
      "timeframe": "30 days"
    },
    {
      "metric": "Critical Issues",
      "currentValue": 8,
      "previousValue": 5,
      "percentageChange": 60.0,
      "timeframe": "30 days"
    }
  ]
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "summary": "Infrastructure metrics show mixed performance over the past 30 days. While total issue volume has increased significantly (+28.85%), the moderate rise in resolution times (+10.53%) suggests maintenance teams are keeping pace. However, the 60% surge in critical issues is a concerning trend requiring immediate investigation.",
    "keyFindings": [
      "Total issue volume increased 28.85% (52 → 67 issues)",
      "Resolution times increased modestly by 10.53% (3.8 → 4.2 days average)",
      "Critical issues spiked 60% (5 → 8 issues), indicating severity escalation",
      "Issue creation rate outpacing resolution capacity"
    ],
    "concerningTrends": [
      "Critical Issues increased by 60.0% - investigate root causes",
      "Total Issues increased by 28.9% - may indicate deferred maintenance catching up",
      "Resolution time degradation suggests resource constraints"
    ],
    "positiveTrends": [
      "Resolution time increase (+10.5%) is manageable given 29% issue volume increase",
      "Team maintaining consistent response despite higher workload"
    ],
    "actionableInsights": [
      "Conduct root cause analysis on the 3 new critical issues to identify systemic problems",
      "Review resource allocation - 29% issue increase may require temporary staffing boost",
      "Implement predictive maintenance in areas with critical issue concentration",
      "Establish triage protocols to prevent medium-severity issues from escalating",
      "Consider preventive inspection programs to catch issues before they become critical"
    ]
  }
}
```

**Use Cases:**

1. **Executive Presentations**: Explain trends to leadership
2. **Performance Reviews**: Analyze maintenance team effectiveness
3. **Budget Justification**: Support resource requests with data
4. **Strategic Planning**: Identify areas needing investment
5. **Stakeholder Communication**: Clear explanations for non-technical audiences

**Example Request:**

```bash
curl -X POST "http://localhost:3001/api/ai/trend-explanation" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "trends": [
      {
        "metric": "MTTR",
        "currentValue": 48,
        "previousValue": 36,
        "percentageChange": 33.33,
        "timeframe": "This month vs. last month"
      }
    ]
  }'
```

---

### 6. Incident Report

**GET** `/api/ai/incident-report/:issueId`

Generate comprehensive incident reports for specific issues using AI analysis.

**Path Parameters:**

- `issueId` (required): Issue ID to generate report for

**Example Request:**

```bash
curl "http://localhost:3001/api/ai/incident-report/issue-12345" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "issueId": "issue-12345",
    "report": {
      "reportTitle": "Critical Infrastructure Incident: Electrical Failure - Science Lab Building",
      "executiveSummary": "A critical electrical system failure occurred in the Science Lab Building on December 21, 2025, affecting power distribution to laboratories and research equipment. The incident was first reported at 09:15 AM when multiple circuit breakers tripped simultaneously, causing a complete power outage to the east wing. Initial assessment indicated an overload condition, but further investigation revealed aging electrical infrastructure as the root cause.\n\nThe outage impacted 12 active research labs, disrupting experiments and potentially compromising temperature-sensitive samples. Emergency backup generators activated successfully, providing partial power restoration within 20 minutes. However, full power restoration required 6 hours of emergency repairs. No injuries occurred, but the incident resulted in estimated research delays valued at $15,000-20,000.\n\nThis incident highlights the urgent need for comprehensive electrical infrastructure upgrades in buildings over 25 years old, particularly those housing critical research equipment and temperature-sensitive materials.",
      "incidentDetails": {
        "what": "Simultaneous circuit breaker failure causing complete power outage to Science Lab east wing",
        "when": "December 21, 2025, 09:15 AM",
        "where": "Science Lab Building, East Wing, Rooms 201-212",
        "severity": "9/10 - Critical infrastructure failure affecting research operations",
        "impact": "12 research labs affected, experiments disrupted, temperature-sensitive samples at risk, emergency generator activation required, 6-hour restoration time"
      },
      "timeline": [
        {
          "timestamp": "09:15 AM",
          "event": "Power outage reported by multiple lab users"
        },
        {
          "timestamp": "09:18 AM",
          "event": "Facilities team dispatched, emergency protocols activated"
        },
        {
          "timestamp": "09:22 AM",
          "event": "Backup generators activated, partial power restored"
        },
        {
          "timestamp": "09:35 AM",
          "event": "Initial assessment completed - multiple circuit breaker failures identified"
        },
        {
          "timestamp": "10:00 AM",
          "event": "Emergency electrician arrived on site"
        },
        {
          "timestamp": "11:30 AM",
          "event": "Root cause identified - overloaded circuits due to aging infrastructure"
        },
        {
          "timestamp": "03:15 PM",
          "event": "Temporary repairs completed, full power restored"
        }
      ],
      "rootCauseAnalysis": "The incident was caused by a combination of aging electrical infrastructure (installed 1998) and gradual increase in power demands from modern research equipment. The original electrical system was not designed for current load requirements. Specific contributing factors include: (1) Deteriorated insulation in main distribution panel, (2) Undersized circuit breakers for modern equipment loads, (3) Lack of surge protection, (4) Insufficient electrical capacity planning for equipment additions over past 10 years. The simultaneous breaker failure suggests a transient overload event that exceeded the aged infrastructure's tolerance.",
      "immediateActions": [
        "Power outage reported and emergency protocols activated",
        "Backup generators engaged within 7 minutes",
        "Temperature-sensitive samples transferred to functional cold storage",
        "Emergency electrician contracted and dispatched",
        "Research supervisors notified of incident and potential sample impact",
        "Temporary power distribution established via portable generators"
      ],
      "preventiveMeasures": [
        "Conduct comprehensive electrical infrastructure assessment for all buildings >20 years old",
        "Implement 5-year electrical system upgrade plan prioritizing research facilities",
        "Install real-time power monitoring systems to detect overload conditions",
        "Establish maximum electrical load guidelines for each building",
        "Require electrical capacity review before new high-power equipment installations",
        "Schedule quarterly electrical system maintenance and testing",
        "Upgrade distribution panels and circuit breakers to modern standards",
        "Implement surge protection at building and critical equipment levels"
      ],
      "lessonsLearned": [
        "Aging infrastructure requires proactive replacement, not reactive maintenance",
        "Emergency generator systems proved effective but highlighted dependency risk",
        "Need for better electrical capacity tracking as equipment is added",
        "Research facility incidents have high financial and academic impact",
        "Communication protocols worked well but could be streamlined",
        "Temperature-sensitive sample protocols saved significant research investment"
      ],
      "recommendations": [
        "Immediate: Commission comprehensive electrical assessment of Science Lab Building",
        "Short-term (30 days): Upgrade distribution panels and install power monitoring",
        "Medium-term (6 months): Complete Science Lab electrical system upgrade",
        "Long-term (1-2 years): Implement campus-wide electrical infrastructure modernization program",
        "Policy: Establish electrical capacity approval process for new equipment",
        "Training: Enhance emergency response training for research facility incidents",
        "Budget: Allocate $500K-750K for Science Lab upgrades, $2-3M for campus-wide program"
      ]
    },
    "relatedIssuesCount": 4,
    "generatedAt": "2025-12-21T16:00:00Z"
  }
}
```

**Report Sections:**

- **Report Title**: Formal incident title
- **Executive Summary**: 2-3 paragraph overview for leadership
- **Incident Details**: 5W structure (what, when, where, severity, impact)
- **Timeline**: Chronological event sequence
- **Root Cause Analysis**: Deep dive into underlying causes
- **Immediate Actions**: Actions taken during incident
- **Preventive Measures**: Steps to prevent recurrence
- **Lessons Learned**: Key takeaways from incident
- **Recommendations**: Specific action items with timeframes

**Use Cases:**

1. **Compliance**: Generate reports for regulatory requirements
2. **Insurance Claims**: Document incidents for insurance
3. **Executive Briefings**: Provide leadership with incident details
4. **Post-Mortem Analysis**: Learn from major incidents
5. **Legal Documentation**: Create formal records
6. **Continuous Improvement**: Track patterns in incident reports

---

### 7. General Insights

**GET** `/api/ai/insights`

Generate AI insights from recent campus infrastructure issues.

**Response**: AI-powered analysis of recent issue patterns and trends.

---

### 8. Building Risk Assessment

**GET** `/api/ai/risk/:buildingId`

Generate risk assessment for a specific building based on recent issues.

**Path Parameters:**

- `buildingId`: Building identifier

---

### 9. Issue Summary

**GET** `/api/ai/summary/:issueId`

Generate natural language summary of a specific issue.

---

### 10. Maintenance Suggestions

**GET** `/api/ai/suggestions`

Get AI-generated maintenance suggestions for issue types.

**Query Parameters:**

- `category`: Issue category
- `severity`: Severity rating (1-10)

---

### 11. AI Chat

**POST** `/api/ai/chat`

Chat with AI assistant about infrastructure management.

**Request Body:**

```json
{
  "message": "How should I prioritize HVAC maintenance?"
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": "Missing parameter",
  "message": "text is required in request body"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Unauthorized",
  "message": "Invalid or expired authentication token"
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": "Issue not found",
  "message": "Issue with ID issue-123 does not exist"
}
```

### 429 Too Many Requests

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to classify issue",
  "message": "Gemini API error: ..."
}
```

---

## Best Practices

### 1. Text Classification

- Provide clear, descriptive text (minimum 10 characters)
- Include location context when available
- Use natural language - AI understands conversational input
- Check `severity` and `priority` before creating tickets

### 2. Voice Processing

- Use high-quality audio recordings
- Minimize background noise
- Supported formats: MP3, WAV, WebM
- Speak clearly and include key details (location, issue type)

### 3. Image Analysis

- Use well-lit, clear images
- Capture the entire affected area
- Include context images if helpful
- Ensure images are publicly accessible

### 4. Admin Summaries

- Request daily summaries at consistent times
- Use trend explanations for board presentations
- Generate incident reports within 24 hours of major issues
- Archive reports for compliance and auditing

### 5. API Integration

- Implement exponential backoff for retries
- Cache AI responses when appropriate
- Monitor rate limits
- Handle errors gracefully with fallback logic

---

## Example Workflows

### Workflow 1: Mobile Issue Submission

```javascript
// User types issue description
const userText = "The toilet in room 305 is overflowing";

// Step 1: Classify the issue
const classification = await fetch("/api/ai/classify-text", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    text: userText,
    buildingName: "Dormitory B",
    zone: "Third Floor",
  }),
});

// Step 2: Create issue with AI-enriched data
const issueData = {
  title: classification.suggestedTitle,
  description: classification.structuredDescription,
  category: classification.category,
  severity: classification.severity,
  priority: classification.priority,
  buildingId: "dorm-b",
  room: classification.extractedLocation.room,
};

await createIssue(issueData);
```

### Workflow 2: Image-Based Reporting

```javascript
// User uploads image
const imageUrl = await uploadToStorage(imageFile);

// Analyze image
const analysis = await fetch("/api/ai/analyze-image", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    imageUrl,
    buildingName: "Library",
  }),
});

// Create issue if issue detected
if (analysis.issueDetected) {
  const issueData = {
    title: analysis.structuredAnalysis.damageType,
    description: analysis.description,
    category: analysis.suggestedCategory,
    severity: analysis.severity,
    priority: analysis.immediateActionRequired ? "critical" : "high",
    imageUrls: [imageUrl],
    aiImageAnalysis: analysis.description,
  };

  await createIssue(issueData);

  // Send alert if safety risk
  if (analysis.safetyRisk) {
    await sendSafetyAlert(issueData);
  }
}
```

### Workflow 3: Automated Daily Reports

```javascript
// Schedule daily at 8 AM
cron.schedule("0 8 * * *", async () => {
  // Generate summary
  const summary = await fetch(`/api/ai/daily-summary?organizationId=${orgId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  // Email to administrators
  await sendEmail({
    to: adminEmails,
    subject: `Daily Infrastructure Summary - ${summary.date}`,
    body: formatSummaryEmail(summary),
  });

  // Post to Slack/Teams
  await postToSlack({
    channel: "#facilities",
    text: summary.executiveSummary,
    attachments: [
      {
        title: "Key Metrics",
        fields: summary.keyMetrics,
      },
    ],
  });
});
```

---

## Rate Limits & Costs

- **Text Classification**: ~$0.001 per request
- **Voice Processing**: ~$0.005 per request (when available)
- **Image Analysis**: ~$0.002 per request
- **Admin Summaries**: ~$0.003 per request

Total monthly cost estimate: $50-200 depending on usage.

---

## Environment Variables

```env
# Required for AI functionality
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional configurations
GEMINI_MODEL=gemini-pro              # Text model
GEMINI_VISION_MODEL=gemini-1.5-flash # Vision model
AI_RATE_LIMIT=10                     # Requests per minute
```

---

## Support

For API issues or questions:

- Technical Documentation: `/docs/api`
- GitHub Issues: `github.com/your-org/ciis`
- Email Support: `support@ciis.edu`

---

**Last Updated**: December 21, 2025
**API Version**: 1.0.0
**Gemini SDK**: @google/generative-ai ^0.24.1
