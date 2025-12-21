# Admin Metrics Guide

## Overview

The Admin Metrics API provides comprehensive operational insights for facilities management and administration, including:

1. **MTTR (Mean Time To Resolve)** - Track how quickly issues are resolved
2. **High-Risk Buildings** - Identify buildings requiring immediate attention
3. **Issue Growth Rate** - Monitor and predict issue volume trends

This guide explains each metric, how they're calculated, and how to use them effectively.

---

## 1. MTTR (Mean Time To Resolve)

### What is MTTR?

MTTR measures the average time (in hours) from when an issue is reported until it's resolved. It's a critical performance indicator for facilities management efficiency.

### How It's Calculated

```typescript
MTTR = Total Resolution Time (hours) / Number of Resolved Issues
```

For each resolved issue:

```typescript
resolutionTime = issue.resolvedAt - issue.createdAt;
```

### Metrics Provided

#### Overall MTTR

The campus-wide average resolution time across all issues.

**Target**: < 48 hours (2 days)

#### MTTR by Category

Resolution times broken down by issue type.

```json
{
  "byCategory": [
    {
      "category": "Electrical",
      "mttr": 72.5,
      "count": 12
    }
  ]
}
```

**Use Case**: Identify which issue types take longest to resolve.

#### MTTR by Building

Resolution times for each building.

```json
{
  "byBuilding": [
    {
      "buildingId": "old-library",
      "buildingName": "Old Library",
      "mttr": 96.8,
      "count": 8
    }
  ]
}
```

**Use Case**: Find buildings with slow resolution times that may need dedicated resources.

#### MTTR by Priority

Resolution times by priority level.

```json
{
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
    }
  ]
}
```

**SLA Targets**:

- Critical: < 12 hours
- High: < 24 hours
- Medium: < 72 hours
- Low: < 168 hours (1 week)

#### MTTR Trend

Weekly MTTR trends over the analysis period.

```json
{
  "trend": [
    {
      "period": "2025-W48",
      "mttr": 52.3
    },
    {
      "period": "2025-W49",
      "mttr": 45.7
    }
  ]
}
```

**Use Case**: Track whether resolution efficiency is improving or degrading over time.

### Interpreting MTTR

**Good Performance**:

- Overall MTTR < 48 hours
- Critical MTTR < 12 hours
- Downward trend over time
- Consistent performance across buildings

**Red Flags**:

- Overall MTTR > 72 hours
- Critical MTTR > 24 hours
- Upward trend
- Wide variation between buildings (indicates resource allocation issues)

### Example Analysis

```typescript
// Fetch MTTR data
const metrics = await fetchAdminMetrics("ORG123", 30);

// Identify problem areas
const slowCategories = metrics.mttr.byCategory
  .filter((cat) => cat.mttr > 72)
  .sort((a, b) => b.mttr - a.mttr);

const slowBuildings = metrics.mttr.byBuilding
  .filter((bldg) => bldg.mttr > metrics.mttr.overall * 1.5)
  .sort((a, b) => b.mttr - a.mttr);

// Check SLA compliance
const criticalSLA = metrics.mttr.byPriority.find(
  (p) => p.priority === "critical"
);

const isCompliant = criticalSLA && criticalSLA.mttr < 12;
```

---

## 2. High-Risk Buildings

### What Are High-Risk Buildings?

Buildings with elevated operational risk due to multiple factors including open issues, severity, age of issues, and recurring problems.

### Risk Score Calculation

```typescript
riskScore =
  (openIssues × 5) +
  (criticalIssues × 20) +
  (avgSeverity × 10) +
  (unressolvedAge × 2) +
  (recurringIssues × 15)
```

### Risk Score Interpretation

| Risk Score | Level    | Action Required                 |
| ---------- | -------- | ------------------------------- |
| 0-50       | Low      | Normal monitoring               |
| 51-100     | Moderate | Schedule preventive maintenance |
| 101-200    | High     | Priority attention needed       |
| 201+       | Critical | Immediate intervention required |

### Metrics Provided

```json
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
}
```

### Risk Factors Explained

| Factor                  | Trigger              | Meaning                        |
| ----------------------- | -------------------- | ------------------------------ |
| Critical Issues Present | `criticalCount > 0`  | Has unresolved critical issues |
| High Average Severity   | `avgSeverity >= 7`   | Issues are generally severe    |
| Long Unresolved Issues  | `avgAge > 14 days`   | Issues sit unresolved too long |
| Recurring Problems      | `recurringCount > 0` | Same issues keep happening     |
| High Issue Volume       | `openIssues > 10`    | Too many open issues           |

### Use Cases

#### 1. Resource Allocation

```typescript
// Prioritize buildings by risk score
const topRiskBuildings = metrics.highRiskBuildings.slice(0, 5).map((b) => ({
  name: b.buildingName,
  score: b.riskScore,
  criticalIssues: b.criticalIssues,
}));

// Assign dedicated teams to high-risk buildings
topRiskBuildings.forEach((building) => {
  assignMaintenanceTeam(building.name);
});
```

#### 2. Executive Reporting

```typescript
// Generate risk summary
const criticalBuildings = metrics.highRiskBuildings.filter(
  (b) => b.riskScore > 200
);

const report = {
  totalBuildings: buildingCount,
  atRisk: metrics.highRiskBuildings.length,
  critical: criticalBuildings.length,
  percentAtRisk: (metrics.highRiskBuildings.length / buildingCount) * 100,
};
```

#### 3. Preventive Maintenance Planning

```typescript
// Buildings with recurring issues need root cause analysis
const recurringProblems = metrics.highRiskBuildings
  .filter((b) => b.recurringIssues > 0)
  .map((b) => ({
    building: b.buildingName,
    recurringCount: b.recurringIssues,
    avgAge: b.unressolvedAge,
  }));

// Schedule deep inspections
recurringProblems.forEach((building) => {
  scheduleInspection(building, "root-cause-analysis");
});
```

---

## 3. Issue Growth Rate

### What is Issue Growth Rate?

Tracks how issue volume is changing over time and projects future trends for capacity planning.

### Metrics Provided

#### Current Period Statistics

```json
{
  "currentPeriod": {
    "total": 67,
    "open": 35,
    "resolved": 28,
    "avgPerDay": 2.23
  }
}
```

#### Comparison with Previous Period

```json
{
  "previousPeriod": {
    "total": 52,
    "open": 28,
    "resolved": 22,
    "avgPerDay": 1.73
  },
  "growthRate": 28.85
}
```

**Growth Rate Calculation**:

```typescript
growthRate = ((currentTotal - previousTotal) / previousTotal) × 100
```

#### Daily Trend

```json
{
  "trend": [
    {
      "period": "2025-12-15",
      "total": 3,
      "open": 2,
      "resolved": 1
    }
  ]
}
```

#### Projections

Simple linear projections based on recent trends:

```json
{
  "projections": {
    "nextWeek": 16,
    "nextMonth": 67
  }
}
```

**Calculation**:

```typescript
avgDailyRate = last7Days.reduce((sum, day) => sum + day.total, 0) / 7
nextWeekProjection = avgDailyRate × 7
nextMonthProjection = avgDailyRate × 30
```

### Interpreting Growth Rate

**Healthy Range**: -10% to +10%

- Issue volume is stable
- Maintenance capacity matches demand

**Growth > +10%**:

- Issue volume increasing
- May need additional resources
- Investigate root causes

**Growth < -10%**:

- Issue volume decreasing
- Maintenance efforts effective
- Good sign unless issues are being underreported

### Use Cases

#### 1. Capacity Planning

```typescript
const metrics = await fetchAdminMetrics("ORG123", 30, 30);

// Check if growth exceeds capacity
if (metrics.issueGrowthRate.growthRate > 20) {
  const projected = metrics.issueGrowthRate.projections.nextMonth;
  const currentCapacity = calculateMonthlyCapacity();

  if (projected > currentCapacity) {
    alert("Need to hire additional maintenance staff");
  }
}
```

#### 2. Seasonal Analysis

```typescript
// Analyze growth across seasons
const q1Metrics = await fetchAdminMetrics("ORG123", 90);
const q4Metrics = await fetchAdminMetrics("ORG123", 90, 90);

const seasonalTrend = {
  winterGrowth: q1Metrics.issueGrowthRate.growthRate,
  fallGrowth: q4Metrics.issueGrowthRate.growthRate,
};

// Adjust staffing for winter season
if (seasonalTrend.winterGrowth > 50) {
  hireSeasonalStaff("winter");
}
```

#### 3. Budget Forecasting

```typescript
const metrics = await fetchAdminMetrics("ORG123", 30);

// Estimate costs based on projections
const avgCostPerIssue = 250; // dollars
const projectedIssues = metrics.issueGrowthRate.projections.nextMonth;
const estimatedCost = projectedIssues * avgCostPerIssue;

const budgetForecast = {
  projectedIssues,
  estimatedCost,
  recommendation:
    estimatedCost > monthlyBudget ? "increase-budget" : "adequate",
};
```

---

## API Usage

### Basic Request

```bash
GET /api/analytics/admin-metrics?organizationId=ORG123&timeWindowDays=30
```

### With Comparison Period

```bash
GET /api/analytics/admin-metrics?organizationId=ORG123&timeWindowDays=30&comparisonTimeWindowDays=30
```

### TypeScript Example

```typescript
interface AdminMetricsRequest {
  organizationId: string;
  timeWindowDays?: number;
  comparisonTimeWindowDays?: number;
}

async function fetchAdminMetrics(
  params: AdminMetricsRequest
): Promise<AdminMetricsResponse> {
  const queryString = new URLSearchParams({
    organizationId: params.organizationId,
    ...(params.timeWindowDays && {
      timeWindowDays: params.timeWindowDays.toString(),
    }),
    ...(params.comparisonTimeWindowDays && {
      comparisonTimeWindowDays: params.comparisonTimeWindowDays.toString(),
    }),
  });

  const response = await fetch(`/api/analytics/admin-metrics?${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}

// Usage
const metrics = await fetchAdminMetrics({
  organizationId: "ORG123",
  timeWindowDays: 30,
  comparisonTimeWindowDays: 30,
});
```

---

## Dashboard Integration

### Executive Dashboard Card

```typescript
function AdminMetricsSummary({ metrics }) {
  return (
    <div className="metrics-grid">
      <MetricCard
        title="Average MTTR"
        value={`${metrics.mttr.overall}h`}
        trend={calculateMTTRTrend(metrics.mttr.trend)}
        status={metrics.mttr.overall < 48 ? 'good' : 'warning'}
      />

      <MetricCard
        title="High-Risk Buildings"
        value={metrics.highRiskBuildings.length}
        status={metrics.highRiskBuildings.length > 3 ? 'critical' : 'good'}
      />

      <MetricCard
        title="Issue Growth"
        value={`${metrics.issueGrowthRate.growthRate}%`}
        trend={metrics.issueGrowthRate.growthRate}
        status={Math.abs(metrics.issueGrowthRate.growthRate) < 10 ? 'good' : 'warning'}
      />
    </div>
  );
}
```

### MTTR Chart

```typescript
function MTTRTrendChart({ trend }) {
  const chartData = {
    labels: trend.map(t => t.period),
    datasets: [{
      label: 'MTTR (hours)',
      data: trend.map(t => t.mttr),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  };

  return <LineChart data={chartData} />;
}
```

### High-Risk Buildings List

```typescript
function HighRiskBuildingsList({ buildings }) {
  return (
    <div className="risk-buildings-list">
      <h3>High-Risk Buildings</h3>
      {buildings.map(building => (
        <div key={building.buildingId} className="building-card">
          <h4>{building.buildingName}</h4>
          <div className="risk-badge" data-level={getRiskLevel(building.riskScore)}>
            Risk Score: {building.riskScore}
          </div>
          <div className="stats">
            <span>Open Issues: {building.openIssues}</span>
            <span>Critical: {building.criticalIssues}</span>
            <span>Avg Age: {building.unressolvedAge} days</span>
          </div>
          <div className="risk-factors">
            {building.riskFactors.map(factor => (
              <span key={factor} className="factor-tag">⚠️ {factor}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Performance Targets

### Recommended SLAs

| Metric            | Target        | Alert Threshold |
| ----------------- | ------------- | --------------- |
| Overall MTTR      | < 48 hours    | > 72 hours      |
| Critical MTTR     | < 12 hours    | > 24 hours      |
| High MTTR         | < 24 hours    | > 48 hours      |
| Buildings at Risk | < 5% of total | > 10% of total  |
| Issue Growth Rate | ±10%          | ±25%            |

### Monitoring Strategy

```typescript
async function monitorPerformance(orgId: string) {
  const metrics = await fetchAdminMetrics({
    organizationId: orgId,
    timeWindowDays: 30,
    comparisonTimeWindowDays: 30,
  });

  const alerts = [];

  // Check MTTR
  if (metrics.mttr.overall > 72) {
    alerts.push({
      type: "critical",
      message: `MTTR (${metrics.mttr.overall}h) exceeds target (72h)`,
    });
  }

  // Check critical MTTR
  const criticalMTTR =
    metrics.mttr.byPriority.find((p) => p.priority === "critical")?.mttr || 0;

  if (criticalMTTR > 24) {
    alerts.push({
      type: "critical",
      message: `Critical MTTR (${criticalMTTR}h) exceeds 24h SLA`,
    });
  }

  // Check high-risk buildings
  const criticalBuildings = metrics.highRiskBuildings.filter(
    (b) => b.riskScore > 200
  );

  if (criticalBuildings.length > 0) {
    alerts.push({
      type: "warning",
      message: `${criticalBuildings.length} buildings have critical risk scores`,
    });
  }

  // Check growth rate
  if (Math.abs(metrics.issueGrowthRate.growthRate) > 25) {
    alerts.push({
      type: "warning",
      message: `Issue growth rate (${metrics.issueGrowthRate.growthRate}%) is unstable`,
    });
  }

  return alerts;
}
```

---

## Testing

### Run Test Script

```bash
cd backend
npm run ts-node src/scripts/test-admin-metrics.ts
```

### Expected Output

```
📊 Testing Admin Metrics...

⏱️  MTTR (Mean Time To Resolve):
Overall MTTR: 48.5 hours

By Category:
  - Structural: 168.2h (5 issues)
  - Electrical: 72.5h (12 issues)

🏢 High-Risk Buildings:
1. Old Library
   Risk Score: 285
   Open Issues: 15 (3 critical)
   ...

📈 Issue Growth Rate:
Current Period:
  - Total Issues: 67
  - Growth Rate: 📈 28.85%
```

---

## Best Practices

1. **Regular Monitoring**: Check metrics daily or weekly
2. **Trend Analysis**: Focus on trends, not single snapshots
3. **Action Plans**: Create response plans for each alert threshold
4. **Documentation**: Record actions taken in response to metrics
5. **Continuous Improvement**: Use metrics to drive process improvements

---

## Support

For issues or questions:

- API Documentation: `/backend/docs/ANALYTICS_API.md`
- Service Code: `/backend/src/modules/analytics/analytics.service.ts`
- Test Script: `/backend/src/scripts/test-admin-metrics.ts`
