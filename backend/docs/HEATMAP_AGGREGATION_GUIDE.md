# Heatmap Aggregation Logic Guide

## Overview

The heatmap aggregation system provides sophisticated visualization of infrastructure issues across campus using three core techniques: **Density Calculation**, **Severity-Weighted Intensity**, and **Time-Based Decay**. This guide explains how each component works and how to configure them for optimal results.

---

## Core Aggregation Techniques

### 1. Density Calculation

**Purpose**: Group nearby issues to reduce visual clutter and identify problem zones.

#### How It Works

The system uses a grid-based spatial aggregation algorithm:

1. **Grid Creation**: The campus is divided into a grid of cells (default: 50m × 50m)
2. **Issue Grouping**: Issues within the same grid cell are grouped together
3. **Centroid Calculation**: The geographic center of grouped issues becomes the heatmap point

```typescript
function aggregateByLocation(
  issues: Issue[],
  gridSize: number = 50
): HeatmapPoint[];
```

#### Algorithm Details

```typescript
// For each issue:
1. Check if issue has valid location (latitude, longitude)
2. Find all nearby issues within gridSize radius
3. Group these issues together
4. Calculate centroid: avgLat = sum(latitudes) / count
5. Create a HeatmapPoint at the centroid
6. Mark all grouped issues as processed
```

#### Configuration

```typescript
{
  gridSize: 50; // Distance in meters for grouping nearby issues
}
```

**Grid Size Guidelines**:

- **25m**: High detail, more points, ideal for building-level analysis
- **50m**: Balanced (default), good for campus zones
- **100m**: Low detail, fewer points, good for large campus overview
- **200m**: Very low detail, regional view

#### Example Usage

```typescript
// Fine-grained density (25m grid)
const detailedHeatmap = await getHeatmapData(filters, {
  gridSize: 25,
  timeDecayFactor: 0.5,
  severityWeightMultiplier: 2.0,
});

// Campus overview (100m grid)
const overviewHeatmap = await getGridHeatmapData(filters, 100);
```

---

### 2. Severity-Weighted Intensity

**Purpose**: Prioritize critical issues by increasing their visual impact on the heatmap.

#### How It Works

Each issue's contribution to the heatmap intensity is multiplied by:

1. **Severity Score** (1-10 normalized to 0-1)
2. **Priority Multiplier** based on issue priority
3. **Configuration Multiplier** (adjustable sensitivity)

```typescript
function applySeverityWeighting(
  points: HeatmapPoint[],
  multiplier: number
): HeatmapPoint[];
```

#### Weight Calculation Formula

```typescript
// For each issue in a heatmap point:
severityScore = issue.severity / 10  // Normalize to 0-1

// Apply priority boost
priorityBoost = {
  CRITICAL: 4.0,  // 4x multiplier
  HIGH:     2.5,  // 2.5x multiplier
  MEDIUM:   1.5,  // 1.5x multiplier
  LOW:      1.0   // No boost
}

weightedSeverity = severityScore × priorityBoost[issue.priority]

// Average for all issues at this point
avgSeverityWeight = sum(weightedSeverity) / issueCount

// Apply to point weight
finalWeight = baseWeight × (1 + avgSeverityWeight × multiplier)
```

#### Configuration

```typescript
{
  severityWeightMultiplier: 2.0; // Higher = more emphasis on severe issues
}
```

**Multiplier Guidelines**:

- **0.5**: Subtle severity emphasis
- **1.0**: Moderate emphasis (severity doubles the weight)
- **2.0**: Strong emphasis (default) - critical issues stand out
- **3.0+**: Very strong emphasis - only severe issues visible

#### Example Scenarios

**Scenario 1: Two Points Comparison**

```
Point A: 10 issues, avg severity = 3, all LOW priority
Point B: 5 issues, avg severity = 8, all CRITICAL priority

Without weighting:
  Point A weight = 10
  Point B weight = 5
  (Point A appears more intense)

With severityWeightMultiplier = 2.0:
  Point A weight = 10 × (1 + (0.3 × 1.0) × 2.0) = 16
  Point B weight = 5 × (1 + (0.8 × 4.0) × 2.0) = 37
  (Point B now appears more intense ✓)
```

**Scenario 2: Emergency Prioritization**

```typescript
// Focus only on critical issues
const emergencyHeatmap = await getHeatmapData(filters, {
  severityWeightMultiplier: 5.0, // Heavy emphasis
  minSeverity: 7, // Only severe issues
  priorities: ["CRITICAL", "HIGH"],
});
```

---

### 3. Time-Based Decay

**Purpose**: Recent issues appear more prominent; older issues fade over time.

#### How It Works

Each issue's weight is reduced exponentially based on its age using the formula:

```
decayWeight = e^(-decayFactor × normalizedAge)
```

Where:

- `normalizedAge` = age of issue / maximum age (0 to 1)
- `decayFactor` = controls how quickly weights decay

```typescript
function applyTimeDecay(
  points: HeatmapPoint[],
  decayFactor: number
): HeatmapPoint[];
```

#### Decay Calculation Details

```typescript
const now = new Date();
const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days in milliseconds

for each issue in point:
  age = now - issue.createdAt  // Age in milliseconds
  normalizedAge = min(age / maxAge, 1)  // Clamp to 0-1

  decayWeight = Math.exp(-decayFactor × normalizedAge)

avgDecayWeight = sum(decayWeights) / issueCount
pointWeight = pointWeight × avgDecayWeight
```

#### Configuration

```typescript
{
  timeDecayFactor: 0.5; // Range: 0 (no decay) to 2+ (fast decay)
}
```

**Decay Factor Guidelines**:

- **0.0**: No decay - all issues weighted equally regardless of age
- **0.3**: Slow decay - issues remain prominent for ~60 days
- **0.5**: Moderate decay (default) - balanced 30-day relevance
- **1.0**: Fast decay - only recent issues (< 2 weeks) prominent
- **2.0**: Very fast decay - only issues from last week visible

#### Decay Curves Visualization

```
Weight Retention over 90 Days:

decayFactor = 0.3 (Slow)
|███████████████████████████████████████| Day 30: 91% weight
|████████████████████████████████| Day 60: 83% weight
|█████████████████████████| Day 90: 74% weight

decayFactor = 0.5 (Moderate - Default)
|███████████████████████████████| Day 30: 86% weight
|██████████████████████| Day 60: 74% weight
|███████████████| Day 90: 64% weight

decayFactor = 1.0 (Fast)
|████████████████████| Day 30: 74% weight
|███████████| Day 60: 55% weight
|██████| Day 90: 41% weight

decayFactor = 2.0 (Very Fast)
|███████████| Day 30: 55% weight
|████| Day 60: 30% weight
|█| Day 90: 17% weight
```

#### Example Scenarios

**Scenario 1: Current Issues Focus**

```typescript
// Show only what's happening NOW
const currentHeatmap = await getHeatmapData(filters, {
  timeDecayFactor: 1.5, // Fast decay
  maxAge: 30, // Last 30 days only
  normalizeWeights: true,
});
```

**Scenario 2: Historical Patterns**

```typescript
// See all issues equally (historical analysis)
const historicalHeatmap = await getHeatmapData(filters, {
  timeDecayFactor: 0.0, // No decay
  startDate: sixMonthsAgo,
  endDate: today,
});
```

**Scenario 3: Progressive Fade**

```typescript
// Gentle fade over time (maintenance planning)
const maintenanceHeatmap = await getHeatmapData(filters, {
  timeDecayFactor: 0.3, // Slow decay
  maxAge: 90, // Quarter view
});
```

---

## Combined Configuration Examples

### Preset 1: Emergency Response Mode

Focus on critical, recent issues requiring immediate attention.

```typescript
const emergencyConfig: HeatmapConfig = {
  timeDecayFactor: 1.0, // Fast decay - recent issues only
  severityWeightMultiplier: 3.0, // Heavy severity emphasis
  gridSize: 25, // High detail
  normalizeWeights: true,
};

const emergencyFilters: HeatmapFilters = {
  organizationId: "ORG123",
  priorities: [IssuePriority.CRITICAL, IssuePriority.HIGH],
  statuses: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
  maxAge: 7, // Last week only
};

const heatmap = await getHeatmapData(emergencyFilters, emergencyConfig);
```

### Preset 2: Maintenance Planning Mode

Identify persistent problem areas over time.

```typescript
const maintenanceConfig: HeatmapConfig = {
  timeDecayFactor: 0.3, // Slow decay - see patterns
  severityWeightMultiplier: 1.5, // Moderate severity weight
  gridSize: 50, // Standard detail
  clusterRadius: 100, // Cluster nearby issues
  minClusterSize: 3, // Minimum 3 issues per cluster
  normalizeWeights: true,
};

const maintenanceFilters: HeatmapFilters = {
  organizationId: "ORG123",
  maxAge: 90, // Last quarter
  statuses: [IssueStatus.OPEN, IssueStatus.RESOLVED],
};

const heatmap = await getHeatmapData(maintenanceFilters, maintenanceConfig);
```

### Preset 3: Campus Overview Mode

High-level view for administration dashboards.

```typescript
const overviewConfig: HeatmapConfig = {
  timeDecayFactor: 0.5, // Balanced decay
  severityWeightMultiplier: 2.0, // Standard severity weight
  gridSize: 100, // Low detail for performance
  clusterRadius: 200, // Large clusters
  minClusterSize: 5,
  normalizeWeights: true,
};

const overviewFilters: HeatmapFilters = {
  organizationId: "ORG123",
  maxAge: 30, // Last month
};

const heatmap = await getHeatmapData(overviewFilters, overviewConfig);
```

### Preset 4: Building-Specific Analysis

Detailed view for a specific building.

```typescript
const buildingConfig: HeatmapConfig = {
  timeDecayFactor: 0.4, // Slower decay for patterns
  severityWeightMultiplier: 2.0, // Standard weight
  gridSize: 10, // Very high detail
  normalizeWeights: true,
};

const buildingFilters: HeatmapFilters = {
  organizationId: "ORG123",
  buildingIds: ["engineering-bldg"],
  maxAge: 60, // Last 2 months
};

const heatmap = await getHeatmapData(buildingFilters, buildingConfig);
```

---

## API Usage

### Basic Request

```bash
GET /api/heatmap?organizationId=ORG123
```

Returns heatmap with default configuration:

- `timeDecayFactor`: 0.5
- `severityWeightMultiplier`: 2.0
- `gridSize`: 50m
- Weights normalized to 0-1

### Advanced Request with Custom Config

```bash
GET /api/heatmap?organizationId=ORG123&timeDecay=1.0&severityWeight=3.0&gridSize=25&maxAge=7&priorities=CRITICAL,HIGH
```

### TypeScript/JavaScript Example

```typescript
interface HeatmapRequest {
  organizationId: string;
  timeDecay?: number;
  severityWeight?: number;
  gridSize?: number;
  clusterRadius?: number;
  maxAge?: number;
  priorities?: string[];
  categories?: string[];
}

async function fetchHeatmap(params: HeatmapRequest) {
  const queryString = new URLSearchParams({
    organizationId: params.organizationId,
    ...(params.timeDecay && { timeDecay: params.timeDecay.toString() }),
    ...(params.severityWeight && {
      severityWeight: params.severityWeight.toString(),
    }),
    ...(params.gridSize && { gridSize: params.gridSize.toString() }),
    ...(params.maxAge && { maxAge: params.maxAge.toString() }),
  });

  const response = await fetch(`/api/heatmap?${queryString}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
}
```

---

## Weight Normalization

After applying all three aggregation techniques, weights are normalized to 0-1 range:

```typescript
normalizedWeight = (weight - minWeight) / (maxWeight - minWeight);
```

This ensures:

- Consistent visual representation across different time periods
- Proper scaling for heatmap visualization libraries
- Fair comparison between different buildings/zones

**When to Disable Normalization**:

```typescript
{
  normalizeWeights: false; // Keep raw weights for statistical analysis
}
```

---

## Performance Optimization

### 1. Grid Size Selection

Larger grid sizes = fewer points = better performance:

```typescript
// Small campus (< 50 buildings): gridSize = 25
// Medium campus (50-200 buildings): gridSize = 50
// Large campus (> 200 buildings): gridSize = 100
```

### 2. Clustering

Use clustering for large datasets:

```typescript
const clusteredHeatmap = await getClusteredHeatmapData(
  filters,
  100, // clusterRadius in meters
  3 // minClusterSize
);
```

### 3. Date Range Filtering

Limit query scope:

```typescript
const filters: HeatmapFilters = {
  organizationId: "ORG123",
  startDate: thirtyDaysAgo,
  endDate: today,
  maxAge: 30, // Double filter for safety
};
```

---

## Troubleshooting

### Issue: Heatmap shows no intensity variation

**Solution**: Increase severity weight or adjust time decay

```typescript
{
  timeDecayFactor: 0.8,              // More emphasis on recency
  severityWeightMultiplier: 3.0,     // Stronger severity weighting
}
```

### Issue: Too many small points

**Solution**: Increase grid size or enable clustering

```typescript
{
  gridSize: 100,                     // Larger aggregation zones
  clusterRadius: 150,
  minClusterSize: 2
}
```

### Issue: Old issues dominating the heatmap

**Solution**: Increase time decay or reduce maxAge

```typescript
{
  timeDecayFactor: 1.0,              // Faster decay
  maxAge: 30                         // Only last 30 days
}
```

### Issue: Critical issues not standing out

**Solution**: Increase severity multiplier and add priority filters

```typescript
{
  severityWeightMultiplier: 4.0,     // Very strong emphasis
  priorities: [IssuePriority.CRITICAL, IssuePriority.HIGH]
}
```

---

## Integration with Frontend

### React/TypeScript Example

```typescript
import { useEffect, useState } from 'react';
import { HeatmapGeoJSON } from './types';

function CampusHeatmap() {
  const [heatmapData, setHeatmapData] = useState<HeatmapGeoJSON | null>(null);
  const [config, setConfig] = useState({
    timeDecay: 0.5,
    severityWeight: 2.0,
    gridSize: 50,
    maxAge: 30
  });

  useEffect(() => {
    fetchHeatmapData();
  }, [config]);

  const fetchHeatmapData = async () => {
    const response = await fetch(
      `/api/heatmap?` +
      `organizationId=${orgId}&` +
      `timeDecay=${config.timeDecay}&` +
      `severityWeight=${config.severityWeight}&` +
      `gridSize=${config.gridSize}&` +
      `maxAge=${config.maxAge}`
    );

    const data = await response.json();
    setHeatmapData(data);
  };

  return (
    <div>
      <HeatmapControls config={config} setConfig={setConfig} />
      <MapView data={heatmapData} />
    </div>
  );
}
```

### Leaflet Integration

```typescript
import L from "leaflet";
import "leaflet.heat";

function renderHeatmap(map: L.Map, data: HeatmapGeoJSON) {
  // Convert GeoJSON to Leaflet heatmap format
  const heatData = data.features.map((feature) => [
    feature.geometry.coordinates[1], // latitude
    feature.geometry.coordinates[0], // longitude
    feature.properties.weight, // intensity
  ]);

  // Create heatmap layer
  L.heatLayer(heatData, {
    radius: 25,
    blur: 15,
    maxZoom: 17,
    max: 1.0,
    gradient: {
      0.0: "blue",
      0.5: "yellow",
      0.7: "orange",
      1.0: "red",
    },
  }).addTo(map);
}
```

---

## Best Practices

1. **Match Configuration to Use Case**: Use presets appropriate for your scenario
2. **Monitor Performance**: Large datasets may require higher gridSize
3. **Update Regularly**: Refresh heatmap data every 5-15 minutes
4. **Cache Wisely**: Cache heatmap data for unchanged filters
5. **Test Different Settings**: Experiment with decay/severity multipliers
6. **Document Choices**: Record why specific configurations were chosen

---

## Future Enhancements

### Planned Features

1. **Adaptive Grid Sizing**: Automatically adjust grid based on issue density
2. **Multi-Factor Weighting**: Combine additional factors (cost, affected users)
3. **Temporal Heatmaps**: Animate heatmap changes over time
4. **Predictive Hotspots**: ML-based prediction of future issue zones
5. **Custom Weight Functions**: User-defined weight calculation formulas

---

## Support

For questions or issues:

- API Documentation: `/backend/docs/HEATMAP_API.md`
- Service Code: `/backend/src/modules/heatmap/heatmap.service.ts`
- Test Script: `/backend/src/scripts/test-heatmap.ts`
