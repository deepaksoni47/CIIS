# Recurring Issues Detection Guide

## Overview

The Recurring Issues Detection feature automatically identifies infrastructure problems that occur repeatedly at the same location within a specified time window. This helps facilities managers prioritize preventive maintenance and address systemic issues.

## How It Works

### Detection Logic

The system groups issues based on:

1. **Category**: Same issue type (e.g., Plumbing, Electrical)
2. **Location**: Same building and floor
3. **Time Window**: Within a configurable number of days (default: 30)
4. **Minimum Occurrences**: At least N occurrences (default: 2)

### Risk Scoring

Each recurring issue group receives a risk score based on multiple factors:

#### Risk Score Formula

```
riskScore = (occurrences × 10) + (avgSeverity × 5) + (openIssuesCount × 15) + frequencyBonus
```

Where:

- **occurrences**: Total number of times the issue has occurred
- **avgSeverity**: Average severity rating (1-10)
- **openIssuesCount**: Number of currently unresolved issues
- **frequencyBonus**: +20 points if issues recur weekly or more frequently

#### Recurring Risk Flag

An issue group is flagged as `isRecurringRisk: true` when:

- Occurrences ≥ 3, OR
- Risk Score ≥ 50

### Location Grouping

#### Basic Mode (without locationRadius)

Groups issues by: `buildingId + floor`

Example: All plumbing issues on Floor 2 of Science Hall

#### Precision Mode (with locationRadius)

Groups issues by: `buildingId + floor + coordinate zones`

- Useful for large buildings or open spaces
- Creates geographic zones based on coordinate rounding
- Example: `locationRadius=0.0001` groups issues within ~10 meters

## API Usage

### Basic Request

```bash
GET /api/analytics/recurring-issues?organizationId=ORG123
```

### Advanced Request

```bash
GET /api/analytics/recurring-issues?organizationId=ORG123&timeWindowDays=60&minOccurrences=3&locationRadius=0.0001
```

### Parameters

| Parameter        | Type   | Default    | Description                           |
| ---------------- | ------ | ---------- | ------------------------------------- |
| `organizationId` | string | _required_ | Your organization ID                  |
| `timeWindowDays` | number | 30         | How many days to look back            |
| `minOccurrences` | number | 2          | Minimum times issue must occur        |
| `locationRadius` | number | -          | Geographic grouping radius (optional) |

## Response Format

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
        "zone": "Room 205",
        "locationKey": "science-hall|2",
        "occurrences": 5,
        "firstOccurrence": "2025-11-15T08:30:00.000Z",
        "lastOccurrence": "2025-12-18T14:20:00.000Z",
        "isRecurringRisk": true,
        "riskScore": 95,
        "issues": [...]
      }
    ],
    "summary": {
      "totalRecurringGroups": 8,
      "totalRecurringIssues": 24,
      "highRiskGroups": 3,
      "buildingsAffected": 4
    }
  }
}
```

## Use Cases

### 1. Preventive Maintenance Planning

Identify issues that require root cause analysis rather than repeated fixes:

```typescript
const result = await fetch(
  `/api/analytics/recurring-issues?organizationId=${orgId}&minOccurrences=3`
);

// Focus on high-risk recurring issues
const criticalIssues = result.data.recurringIssues
  .filter((issue) => issue.isRecurringRisk)
  .slice(0, 10);
```

### 2. Resource Allocation

Prioritize facilities budget for persistent problems:

```typescript
// Get recurring issues for the past quarter
const result = await fetch(
  `/api/analytics/recurring-issues?organizationId=${orgId}&timeWindowDays=90`
);

const totalCost = result.data.recurringIssues.reduce(
  (sum, issue) => sum + estimateCost(issue),
  0
);
```

### 3. Building Health Monitoring

Track which buildings have the most recurring issues:

```typescript
const result = await fetch(
  `/api/analytics/recurring-issues?organizationId=${orgId}`
);

const buildingStats = groupBy(
  result.data.recurringIssues,
  (issue) => issue.buildingId
);
```

### 4. Issue Pattern Analysis

Detect patterns in recurring issues:

```typescript
// Weekly recurrence check
const result = await fetch(
  `/api/analytics/recurring-issues?organizationId=${orgId}&timeWindowDays=30&minOccurrences=4`
);

// Issues recurring 4+ times in 30 days = potential systemic problem
```

## Dashboard Integration

### Display High-Risk Recurring Issues

```typescript
interface RecurringIssueCard {
  title: string;
  buildingName: string;
  occurrences: number;
  riskScore: number;
  lastOccurrence: Date;
}

function RecurringIssuesWidget() {
  const [issues, setIssues] = useState<RecurringIssueCard[]>([]);

  useEffect(() => {
    fetchRecurringIssues().then(data => {
      const highRisk = data.recurringIssues
        .filter(i => i.isRecurringRisk)
        .map(i => ({
          title: `${i.category} - ${i.buildingName}`,
          buildingName: i.buildingName,
          occurrences: i.occurrences,
          riskScore: i.riskScore,
          lastOccurrence: new Date(i.lastOccurrence)
        }));
      setIssues(highRisk);
    });
  }, []);

  return (
    <div className="recurring-issues-widget">
      <h3>⚠️ High-Risk Recurring Issues</h3>
      {issues.map(issue => (
        <div key={issue.title} className="issue-card">
          <h4>{issue.title}</h4>
          <div>Occurrences: {issue.occurrences}</div>
          <div>Risk Score: {issue.riskScore}</div>
          <div>Last: {issue.lastOccurrence.toLocaleDateString()}</div>
        </div>
      ))}
    </div>
  );
}
```

### Summary Statistics

```typescript
function RecurringSummary({ summary }) {
  return (
    <div className="summary-stats">
      <StatCard
        title="Recurring Groups"
        value={summary.totalRecurringGroups}
        icon="🔄"
      />
      <StatCard
        title="Total Issues"
        value={summary.totalRecurringIssues}
        icon="📋"
      />
      <StatCard
        title="High Risk"
        value={summary.highRiskGroups}
        icon="⚠️"
        variant="danger"
      />
      <StatCard
        title="Buildings Affected"
        value={summary.buildingsAffected}
        icon="🏢"
      />
    </div>
  );
}
```

## Testing

### Run Test Script

```bash
cd backend
npm run ts-node src/scripts/test-recurring-issues.ts
```

### Expected Output

```
🔍 Testing Recurring Issues Detection...

Parameters:
- Organization ID: ggv-university
- Time Window: 60 days
- Min Occurrences: 2

📊 Summary:
- Total Recurring Groups: 5
- Total Recurring Issues: 15
- High Risk Groups: 2
- Buildings Affected: 3

🚨 Recurring Issues (Top 5 by Risk Score):
...
```

## Best Practices

### 1. Time Window Selection

- **7-14 days**: Immediate recurring issues (urgent)
- **30 days**: Monthly recurring patterns (standard)
- **60-90 days**: Long-term trends (planning)

### 2. Minimum Occurrences

- **2**: Catch early recurring patterns
- **3+**: Focus on established recurring issues
- **5+**: Identify chronic systemic problems

### 3. Location Radius

- **No radius**: Building-wide or floor-wide grouping
- **0.0001**: ~10 meter zones (individual rooms)
- **0.0005**: ~50 meter zones (building sections)

### 4. Response Handling

```typescript
// Check for recurring issues
const response = await fetchRecurringIssues(orgId);

if (response.data.summary.highRiskGroups > 0) {
  // Alert facilities management
  notifyFacilitiesManager(response.data.recurringIssues);

  // Create preventive maintenance tasks
  createPreventiveMaintenanceTasks(
    response.data.recurringIssues.filter((i) => i.isRecurringRisk)
  );
}
```

## Future Enhancements

### Planned Features

1. **Automated Alerts**: Email/SMS notifications for new recurring risks
2. **ML Predictions**: Predict which issues are likely to recur
3. **Root Cause Suggestions**: AI-generated recommendations
4. **Historical Trends**: Compare current vs. previous periods
5. **Export Reports**: PDF/Excel reports for management

### Integration Opportunities

- **Work Order System**: Auto-create preventive maintenance orders
- **Budget Planning**: Cost estimation for recurring issues
- **Vendor Management**: Identify contractor performance issues
- **Student Safety**: Alert for recurring safety hazards

## Troubleshooting

### No Recurring Issues Found

- Reduce `minOccurrences` to 2
- Increase `timeWindowDays` to 60 or 90
- Check if sufficient data exists in the system

### Too Many False Positives

- Increase `minOccurrences` to 3 or 4
- Use `locationRadius` for more precise grouping
- Filter by `riskScore` >= 60 for high-priority only

### Performance Issues

- Reduce `timeWindowDays` for faster queries
- Add database indexes on frequently queried fields
- Implement caching for repeated requests

## Support

For issues or questions:

- Check API documentation: `/backend/docs/ANALYTICS_API.md`
- Review code: `/backend/src/modules/analytics/analytics.service.ts`
- Test endpoint: `GET /api/analytics/recurring-issues`
