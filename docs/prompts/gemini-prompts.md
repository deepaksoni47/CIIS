# Gemini API Prompts for CampusCare

This document contains the prompt templates used for interacting with the Google Gemini API for generating insights, reports, and recommendations.

## 1. Infrastructure Insight Generation

### Prompt Template: Area Maintenance Priority

```
You are an infrastructure management assistant for a campus. Analyze the following data and provide actionable insights.

Context:
- Time Period: {time_period}
- Categories: {categories}

Issue Statistics:
{issue_statistics_json}

Zone/Building Data:
{zone_data_json}

Risk Scores:
{risk_scores_json}

Task:
Based on the data above, answer the following query in a clear, actionable manner:
"{user_query}"

Provide:
1. A concise summary (2-3 sentences)
2. Key findings with specific data points
3. Prioritized recommendations
4. Areas requiring urgent attention

Format your response in a professional, administrator-friendly tone.
```

### Example Usage:

```json
{
  "time_period": "Last 30 days",
  "categories": ["WATER", "ELECTRICITY"],
  "issue_statistics_json": {
    "total_issues": 45,
    "by_category": {
      "WATER": 28,
      "ELECTRICITY": 17
    },
    "avg_severity": 3.5,
    "open_issues": 23
  },
  "zone_data_json": [
    {
      "zone_id": "ZONE-A",
      "building": "Engineering Building",
      "issue_count": 15,
      "avg_severity": 4.2
    }
  ],
  "risk_scores_json": [
    {
      "zone_id": "ZONE-A",
      "risk_score": 8.7,
      "recurrence_probability": 0.78
    }
  ],
  "user_query": "Which areas need urgent maintenance?"
}
```

## 2. Weekly/Monthly Report Generation

### Prompt Template: Periodic Report

```
You are generating an infrastructure management report for campus administrators.

Report Details:
- Type: {report_type}
- Period: {start_date} to {end_date}

Summary Statistics:
{summary_statistics_json}

Trend Analysis:
{trend_data_json}

Top Issues:
{top_issues_json}

Zone Performance:
{zone_performance_json}

Task:
Generate a comprehensive {report_type} infrastructure report with the following sections:

1. Executive Summary (3-4 sentences highlighting key metrics and changes)
2. Key Findings (3-5 bullet points)
3. Trend Analysis (describe patterns and changes from previous periods)
4. High-Risk Areas (identify zones/buildings needing attention)
5. Recommendations (3-5 actionable items for administrators)

Use a professional, data-driven tone. Include specific numbers and percentages.
```

### Example Usage:

```json
{
  "report_type": "Weekly",
  "start_date": "2025-12-09",
  "end_date": "2025-12-16",
  "summary_statistics_json": {
    "total_issues": 67,
    "change_from_last_period": "+15%",
    "avg_severity": 3.2,
    "resolution_rate": 0.78
  },
  "trend_data_json": [
    {
      "category": "WATER",
      "count": 28,
      "trend": "increasing"
    }
  ]
}
```

## 3. Issue Categorization Assistant

### Prompt Template: Issue Classification

```
You are an assistant helping to categorize infrastructure issues.

Available Categories:
- WATER: Leakage, low pressure, contamination
- ELECTRICITY: Outages, flickering lights, socket issues
- WIFI: Connectivity problems, slow speed, no signal
- SANITATION: Cleanliness, waste disposal, odor
- CROWDING: Overcapacity, congestion
- TEMPERATURE: HVAC issues, extreme temperatures
- OTHER: Issues not fitting above categories

User Complaint:
"{user_complaint_text}"

Task:
1. Classify this complaint into the most appropriate category
2. Suggest a severity level (1-5 scale)
3. Identify key details that should be extracted
4. Recommend if this is a duplicate of common issues

Respond in JSON format:
{
  "category": "<CATEGORY>",
  "suggested_severity": <1-5>,
  "key_details": ["detail1", "detail2"],
  "is_potential_duplicate": <true/false>,
  "reasoning": "Brief explanation"
}
```

### Example Usage:

```json
{
  "user_complaint_text": "There's water dripping from the ceiling in Room 204 and the floor is getting wet"
}
```

## 4. Root Cause Analysis

### Prompt Template: Pattern Investigation

```
You are analyzing recurring infrastructure issues to identify root causes.

Issue History:
{issue_history_json}

Location Data:
{location_details_json}

Environmental Factors:
{environmental_data_json}

Query:
"Why are {category} issues increasing in {location}?"

Task:
Analyze the data and provide:
1. Potential root causes (prioritized list)
2. Supporting evidence from the data
3. Questions for further investigation
4. Preventive measures

Use analytical language and cite specific data points.
```

## 5. Maintenance Priority Scoring

### Prompt Template: Priority Recommendation

```
You are helping prioritize maintenance tasks.

Issue Details:
{issue_details_json}

Current Workload:
{current_workload_json}

Resource Availability:
{resources_json}

Task:
Evaluate the urgency and suggest priority level (HIGH, MEDIUM, LOW) with justification.

Consider:
- Severity of the issue
- Number of affected users
- Safety implications
- Resource requirements
- Historical patterns

Provide a structured recommendation with reasoning.
```

## 6. Predictive Insight Generation

### Prompt Template: Future Risk Assessment

```
You are forecasting potential infrastructure issues.

Historical Data:
{historical_trends_json}

Seasonal Patterns:
{seasonal_data_json}

Current Status:
{current_status_json}

Task:
Predict which areas/categories are at highest risk in the next {time_period}.

Provide:
1. Top 3 risk areas with probability estimates
2. Recommended proactive measures
3. Key indicators to monitor

Be specific and data-driven in your predictions.
```

## Best Practices

### Prompt Engineering Tips:

1. **Be Specific**: Provide clear context and structured data
2. **Use Examples**: Include sample data formats
3. **Set Expectations**: Clearly state desired output format
4. **Iterative Refinement**: Test and refine prompts based on responses
5. **Temperature Settings**:
   - Reports: 0.3-0.5 (more factual)
   - Insights: 0.5-0.7 (balanced)
   - Recommendations: 0.6-0.8 (more creative)

### Data Formatting:

- Use JSON for structured data
- Include units for measurements
- Provide date ranges in ISO format
- Use consistent naming conventions

### Response Handling:

- Validate JSON responses
- Handle API errors gracefully
- Implement retry logic
- Cache responses when appropriate
- Set appropriate timeouts (30-60 seconds)

## API Configuration

```javascript
// Recommended Gemini API Settings
const geminiConfig = {
  model: "gemini-pro",
  temperature: 0.5,
  maxOutputTokens: 2048,
  topP: 0.8,
  topK: 40,
};
```
